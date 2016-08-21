var http = require('http')

var url = require('url')

var fs = require('fs')

var querystring = require('querystring')

var mysql = require('mysql')

var conexion = mysql.createConnection( {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'clinica'
});


conexion.connect ( function (error) {
	if( error ) {
		console.log('Error al conectar con MySQL')
	}
	else {}
});

// Definición de los tipo de datos que se manejaran en la aplicación
var mime = {
	'html': 'text/html',
	'css': 'text/css',
	'jpg': 'image/jpg',
	'ico': 'image/x-icon',
	'mp3': 'audio/mpeg3',
	'mp4': 'video/mp4'
};

// Configuración de la variable servidor y detectando la ruta del recurso
var servidor = http.createServer( function (pedido, respuesta)  {
	var objetourl = url.parse( pedido.url )

	var camino = ''
	camino = 'public' + objetourl.pathname
	if( camino == 'public/' ) {
		camino = 'public/index.html'
	}
	else {
		console.log(camino)
		encaminar(pedido, respuesta, camino)
	}
	camino = ''
});

servidor.listen(8989)

function encaminar( pedido, respuesta, camino ) {
	// console.log('Ruta (encaminar): ' + camino)
	switch( camino ) {
		case 'public/presentacion/adicionarpaciente': {			
			adicionarPaciente(pedido,respuesta)
			break
		}
		case 'public/presentacion/consultarpacientes': {
			consultarPacientes(pedido,respuesta)
			break
		}
		default: {
			// console.log('Camino1: '+camino)
			fs.exists( camino, function( existe ) {
				// console.log('Camino2: '+camino)
				if( existe ) {
					fs.readFile( camino, function (error, contenido){
						// console.log('Camino3: '+camino)
						if( error ) {
							respuesta.writeHead(500, {'Content-Type': 'text/plain'})
							respuesta.write('Error interno en Node')
							respuesta.end()
						} 
						else {
							var vec = camino.split('.')
							var extension = vec[vec.length-1]
							var mimearchivo = mime[extension]
							respuesta.writeHead(200, {'Content-Type': mimearchivo})
							respuesta.write(contenido)
							respuesta.end()
						}
					});
				}
				else {
					camino = ''
					// Encabezado de la página de respuesta
					respuesta.writeHead(400, {'Content-Type': 'text/html'})
					fs.readFile('head.html','utf8', function (err, data) {
						if(err) respuesta.end('no existe el archivo head.html')
						else {
							respuesta.write(data)
							respuesta.write('<h1>No existe el recurso</h1>')
							fs.readFile('footer.html', 'utf8', function (err, data) {
								if(err) respuesta.end()
								respuesta.write(data)
								respuesta.end()
							});
							respuesta.end()
						}
					});
					
					// opcion 1
					// console.log(head)
					// respuesta.write(head.text)
					// respuesta.write('<h1>No existe el recurso</h1>')
					// respuesta.write(footer.text)
					
					// opcion 2
					// respuesta.write('<!doctype html><html><head><title></title></head><body><h1>Recurso inexistente</h1></body></html>')
					// respuesta.end()

					// opcion 3
					// respuesta.write('<!doctype html>')
					// respuesta.write('<html>')
					// respuesta.write('<head><title>Error...</title></head>')
					// respuesta.write('<body>')
					// respuesta.write('<h1>No existe el recurso</h1>')
					// respuesta.write('</body>')
					// respuesta.write('</html>')
					// respuesta.end()				
				}
			});
		}
	}
}

function adicionarPaciente( pedido, respuesta ) {
	
	var info = '';

	pedido.on('data', function( datosparciales ) {
		info += datosparciales
	});

	pedido.on('end', function() {
		var formulario = querystring.parse(info)		

		var alergias_temp = obtenerAlergias(formulario);

		// Datos del paciente a insertar en la base de datos
		var registro = {
			cedula:formulario['cedula'],
			nombres:formulario['nombres'],
			apellidos:formulario['apellidos'],
			direccion:formulario['direccion'],
			telefono:formulario['telefono'],
			edad:formulario['edad'],
			peso:formulario['peso'],
			estatura:formulario['estatura'],
			sexo:formulario['sexo'],			
			alergias:alergias_temp,
			rh:formulario['rh']
		};
		
		// Insertando a la base de datos los datos del paciente
		conexion.query('insert into pacientes set ?',registro, function ( error, resultado ) {
			if( error ) {
				console.log(error) 
				return
			}
		});

		var htmlRespuesta = new String('')
		
		respuesta.writeHead(400, {'Content-Type': 'text/html'})
		var head = fs.readFileSync('head.html','utf8')
		htmlRespuesta += head + '<p class="respuestas_server">Paciente adicionado.</p>'
		var pie = fs.readFileSync('footer.html', 'utf8')

		htmlRespuesta += pie

		respuesta.write(htmlRespuesta)
		respuesta.end()
	});
}

// Función para consultar todos los pacientes
function consultarPacientes ( pedido, respuesta ) {
	var info='';
    pedido.on('data', function(datosparciales){
        info += datosparciales;
    	
    });
    pedido.on('end', function(){
        var formulario = querystring.parse(info);
		var dato=[formulario['cedula']]

		// campos a obtener de la base de datos del paciente
		var datosPaciente = ''
		datosPaciente = 'cedula,'
		datosPaciente += 'nombres,'
		datosPaciente += 'apellidos,'
		datosPaciente += 'direccion,'
		datosPaciente += 'telefono,'
		datosPaciente += 'edad,'
		datosPaciente += 'peso,'
		datosPaciente += 'estatura,'
		datosPaciente += 'sexo,'
		datosPaciente += 'alergias,'
		datosPaciente += 'rh'

		conexion.query('select '+datosPaciente+' from pacientes where cedula=?',dato, function(error,filas){
			if (error) {			
				console.log('error en la consulta')
				return;
			}
			

			var datos = ''
			if (filas.length>0) {
				datos+='Nombres: '+filas[0].nombres+'<br>'
				datos+='Apellidos: '+filas[0].apellidos+'<br>'
				datos+='Dirección: '+filas[0].direccion+'<br>'
				datos+='Teléfono: '+filas[0].telefono+'<br>'
				datos+='Edad: '+filas[0].edad+' años<br>'
				datos+='Peso: '+filas[0].peso+' kgs <br>'
				datos+='Estatura: '+filas[0].estatura+' cms <br>'
				datos+='Sexo: '+filas[0].sexo+'<br>'
				datos+='Alergias: '+filas[0].alergias+'<br>'
				datos+='RH:'+filas[0].rh+'<hr>'
			} else {
				datos='No existe un artículo con dicho codigo.'
			}	

			// Mostrará los datos del paciente al buscar por el campo 'cedula'
			mostrarPacientePorCedula(datos, respuesta)

		});
	  
    });
}

// Funciones de utilidad

// Función que crea una página con los datos obtenidos en la consulta de paciente por el campo 'cedula'
function mostrarPacientePorCedula(datos, respuesta) {
	respuesta.writeHead(200, {'Content-Type': 'text/html'});
	respuesta.write('<!doctype html>')
	respuesta.write('<html>')
	respuesta.write('<head>')
	respuesta.write('<meta charset="utf-8">')
	respuesta.write('</head>')
	respuesta.write('<body>')
	respuesta.write(datos)
	respuesta.write('<a href="consultarpacientes.html">Retornar</a>')
	respuesta.write('</body>')
	// respuesta.$.ajax({
	// 	url: 'consultarpacientes',
	// 	type: 'POST',
	// 	dataType: 'html',
	// 	data: {param1: 'value1'},
	// })
	// .done(function() {
	// 	console.log("success");
	// })
	// .fail(function() {
	// 	console.log("error");
	// })
	// .always(function() {
	// 	console.log("complete");
	// });
	
	respuesta.end()
}

// Contruye el encabezador

function obtenerAlergias(formulario) {
	var alergias = ''
	if( formulario['leche']=='on' )
		alergias+='leche, '
	if ( formulario['huevos']=='on' )
		alergias+='huevos, '
	if ( formulario['pescado']=='on' )
		alergias+='pescado, '
	if ( formulario['maiz']=='on' )
		alergias+='maiz, '
	if( formulario['picaduras_insectos']=='on' )
		alergias+='picaduras_insectos, '
	if( formulario['perros']=='on' )
		alergias+='perros, '
	if( formulario['gatos']=='on' )
		alergias+='gatos, '
	if( formulario['otro']!='' )
		alergias+=formulario['otro']+', '
	if( formulario['otro_tipo_alergia']!='' )
		alergias+=formulario['otro_tipo_alergia']
	return alergias
}

console.log('servidor de clinica iniciado...')
