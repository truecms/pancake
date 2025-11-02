const Sass = require( 'sass' );
const Fs = require( 'fs' );
const Path = require( 'path' );

const mapStyle = ( style = 'expanded' ) => {
	if( style === 'compressed' ) {
		return 'compressed';
	}

	return 'expanded';
};

module.exports = {
	render( options = {}, callback = () => {} ) {
	try {
			const result = Sass.compileString( options.data || '', {
				style: mapStyle( options.outputStyle ),
				loadPaths: options.includePaths || [],
				importers: [ {
					canonicalize( url ) {
						if( url.startsWith( 'file:' ) ) {
							return new URL( url );
						}

						if( url.startsWith( '/' ) ) {
							return new URL(`file://${ url }`);
						}

						return null;
					},
					load( canonicalUrl ) {
						const filePath = Path.normalize( canonicalUrl.pathname );
						const contents = Fs.readFileSync( filePath, 'utf8' );

						return {
							contents,
							syntax: 'scss',
						};
					},
				} ],
			});
			const css = Buffer.from( result.css, 'utf8' );
			callback( null, { css } );
		}
		catch( error ) {
			callback( error );
		}
	},
};
