/** nodebee cluster master
 *  2014 kevin von flotow
 *
 *  forks number of workers equal to number
 *  of CPUs and reloads them on crash
 */
 ( function ()
	{
		var CLUSTER = require( 'cluster' )
		
		if ( !CLUSTER.isMaster )
		{
			return
		}
		
		var OS = require( 'os' )

		var FS = require( 'fs' )

		var PATH = require( 'path' )

		var KEY_DIR = PATH.join( __dirname, '.nbkey' )

		var MESSAGES = require( PATH.join( __dirname, 'lib', 'messages' ) )
		
		var NUM_CPUS = OS.cpus().length || 1

		var Uid = require( PATH.join( __dirname, 'lib', 'constructors', 'Uid' ) )

		function forkWorker( data )
		{
			var worker = CLUSTER.fork( data )

			worker
				.on( 'listening', function ( address )
					{
						// worker listening
					}
				)

				.on( 'exit', function ( code, signal )
					{
						if ( signal )
						{
							console.log( 'worker was killed by signal: ' + signal )
									
							// should we fork a new worker here?
						}
						else if ( code !== 0 )
						{
							console.log( 'worker exited with error code: ' + code )
									
							// worker crashed, fork a new one
							forkWorker( data )
						}
						else
						{
							console.log( 'worker success!' )
						}
					}
				)
		}

		// WARNING WARNING WARNING!!!!!
		// deleting or changing this file will make the
		// database unreadable, and unrecoverable

		// check for .nbkey file
		// if it doesn't exist, create it
		if ( !FS.existsSync( KEY_DIR ) )
		{
			FS.writeFileSync( KEY_DIR, Uid.gen( 256 ) + '\r\n', 'binary' )
		}
		
		// read key from .nbkey file
		FS.readFile( KEY_DIR,
			{
				'encoding': 'binary'
			},
			function ( err, data )
			{
				// make sure data is set
				data = data || ''

				// make sure data is a string,
				// and remove extra whitespace
				var KEY = data.toString().trim()

				// extra data to send to worker
				// sets in process.env
				var workerData = {
					// process.env.NBKEY
					'NBKEY': KEY
				}

				// lock at 2 threads for now
				for ( var i = 0; i < 2; ++i )
				{
					forkWorker( workerData )
				}
			}
		)
	}
)()
