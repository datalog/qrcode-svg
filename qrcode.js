/**
	https://github.com/datalog/qrcode-svg
	under MIT license
	# qrcode.js has no dependencies
	Copyright (c) 2020-2026 Constantine
 */

/**
 	QR Code encoding is based on the implementation by
	@nayuki (https://github.com/nayuki/QR-Code-generator)
 */

 /**
	Original source restored from the previously published minified version.
*/

'use strict';
function QRCode( Q ) {

	var
	 qrVersion ,errorCorrectionLevel ,qrMask ,qrSize
	,modules = [] ,isFunction = []
	,max = Math.max ,min = Math.min ,abs = Math.abs ,ceil = Math.ceil
	,NUMERIC_REGEX = /^[0-9]*$/ ,ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/
	,ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"

	/* version      1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    error correction level */
       ,ECC_CODEWORDS_PER_BLOCK = [
		 [ -1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ] /* low */
		,[ -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28 ] /* medium */
		,[ -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ] /* quartile */
		,[ -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ] /* high */
        ]

        ,NUM_ERROR_CORRECTION_BLOCKS = [
		 [ -1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25 ] /* low */
		,[ -1,  1,  1,  1,  2,  2,  4,  4,  4,  5,  5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49 ] /* medium */
		,[ -1,  1,  1,  2,  2,  4,  4,  6,  6,  8,  8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68 ] /* quartile */
		,[ -1,  1,  1,  2,  4,  4,  4,  5,  6,  8,  8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81 ] /* high */
        ]

	,eccLevels = { L: [ 0, 1 ], M: [ 1, 0 ], Q: [ 2, 3 ], H: [ 3, 2 ] }


	,reedSolomonMultiply = function( x, y ) { /* gf(256) multiply, modulus 0x11d. */
		var z = 0, i = 8;
		while( i-- ) z = z << 1 ^ 285 * ( z >>> 7 ) ^ ( y >>> i & 1 ) * x;
		return z;
	}

	,reedSolomonComputeRemainder = function( data, divisor ) { /* reed-solomon remainder. */
		var result = [] ,i = data.length ,j ,factor;
		while( i ) {
			factor = data[ data.length - i-- ] ^ result.shift();
			j = divisor.length;
			while( j-- ) result[ j ] ^= reedSolomonMultiply( divisor[ j ], factor );
		}
		return result;
	}

	,applyMask = function( mask ) { /* mask data modules only. */
		var
		patterns = [
			 function() { return 0 == ( row + col ) % 2; }
			,function() { return 0 == row % 2; }
			,function() { return 0 == col % 3; }
			,function() { return 0 == ( row + col ) % 3; }
			,function() { return 0 == ( ( row / 2 | 0 ) + ( col / 3 | 0 ) ) % 2; }
			,function() { return 0 == row * col % 2 + row * col % 3; }
			,function() { return 0 == ( row * col % 2 + row * col % 3 ) % 2; }
			,function() { return 0 == ( ( row + col ) % 2 + row * col % 3 ) % 2; }
		]
		,pattern = patterns[ mask ]
		,col
		,row = qrSize;

		while( row-- ) {
			col = qrSize;
			while( col-- )
				if( !isFunction[ row ][ col ] ) modules[ row ][ col ] ^= pattern();
		}
	}

	,getPenaltyScore = function() { /* mask penalty: runs, 2x2 blocks, patterns, balance. */
		function addRun( length, history ) {
			if( !history[ 6 ] ) length += qrSize;
			history.shift();
			history.push( length );
		}
		function countPatterns( history ) {
			var run = history[ 5 ] ,pattern = run > 0 && history[ 4 ] == run && history[ 3 ] == 3 * run &&
				history[ 2 ] == run && history[ 1 ] == run;
			return ( pattern && history[ 6 ] >= 4 * run && history[ 0 ] >= run ? 1 : 0 ) +
				( pattern && history[ 0 ] >= 4 * run && history[ 6 ] >= run ? 1 : 0 );
		}
		function finishRun( color, length, history ) {
			if( color ) {
				addRun( length, history );
				length = 0;
			}
			addRun( length + qrSize, history );
			return countPatterns( history );
		}

		var penalty = 0 ,area = qrSize * qrSize ,darkCount = 0 ,row = qrSize ,col;
		var rowHistory ,colHistory ,rowColor ,colColor ,rowRun ,colRun ,module;
		while( row-- ) {
			rowHistory = [ 0, 0, 0, 0, 0, 0, 0 ];
			colHistory = [ 0, 0, 0, 0, 0, 0, 0 ];
			rowColor = false;
			colColor = false;
			rowRun = 0;
			colRun = 0;
			col = qrSize;
			while( col-- ) {
				if( modules[ row ][ col ] == rowColor ) {
					if( 5 == ++rowRun ) penalty += 3;
					else if( rowRun > 5 ) penalty++;
				} else {
					addRun( rowRun, rowHistory );
					penalty += 40 * countPatterns( rowHistory );
					rowRun = 1;
					rowColor = modules[ row ][ col ];
				}
				if( modules[ col ][ row ] == colColor ) {
					if( 5 == ++colRun ) penalty += 3;
					else if( colRun > 5 ) penalty++;
				} else {
					addRun( colRun, colHistory );
					penalty += 40 * countPatterns( colHistory );
					colRun = 1;
					colColor = modules[ col ][ row ];
				}
				module = modules[ row ][ col ];
				if( module ) darkCount++;
				if( col && row && module == modules[ row ][ col - 1 ] &&
					module == modules[ row - 1 ][ col ] && module == modules[ row - 1 ][ col - 1 ] ) penalty += 3;
			}
			penalty += 40 * finishRun( rowColor, rowRun, rowHistory ) +
				40 * finishRun( colColor, colRun, colHistory );
		}
		return penalty += 10 * ( ceil( abs( 20 * darkCount - 10 * area ) / area ) - 1 );
	}

	,appendBits = function( value, length, bits ) { /* most significant bit first. */
		while( length-- ) bits.push( value >>> length & 1 );
	}

	,numCharCountBits = function( segment, version ) { /* character count field width. */
		return segment.numBitsCharCount[ ( version + 7 ) / 17 | 0 ];
	}

	,getBit = function( value, index ) {
		return 0 != ( value >>> index & 1 );
	}

	,getTotalBits = function( segments, version ) { /* segment headers and payload bits. */
		var total = 0 ,i = segments.length ,segment ,countBits;
		while( i-- ) {
			segment = segments[ i ];
			countBits = numCharCountBits( segment, version );
			if( segment.numChars >= ( 1 << countBits ) ) return Infinity;
			total += 4 + countBits + segment.bitData.length;
		}
		return total;
	}

	,getNumRawDataModules = function( version ) { /* data modules, including remainder bits. */
		if( version < 1 || version > 40 ) throw "Version number out of range";
		var result = ( 16 * version + 128 ) * version + 64;
		if( version >= 2 ) {

			var alignPatCount = ( version / 7 | 0 ) + 2;
			result -= ( 25 * alignPatCount - 10 ) * alignPatCount - 55;
			if( version >= 7 ) result -= 36;
		}
		return result;
	}

	,drawAlignmentPattern = function( x, y ) { /* 5x5 alignment pattern. */
		for( var dy = 2; dy >= - 2; dy-- )
			for( var dx = 2; dx >= - 2; dx-- )
				setFunctionModule( x + dx, y + dy, 1 != max( abs( dx ), abs( dy ) ) );
	}

	,drawFinderPattern = function( x, y ) { /* finder pattern and separator. */
		var dist ,px ,py;
		for( var dy = 4; dy >= - 4; dy-- )
			for( var dx = 4; dx >= - 4; dx-- ) {
				dist = max( abs( dx ), abs( dy ) );
				px = x + dx;
				py = y + dy;
				if( px >= 0 && px < qrSize && py >= 0 && py < qrSize )
					setFunctionModule( px, py, 2 != dist && 4 != dist );
			}
	}

	,drawFormatBits = function( mask ) { /* bch format bits, both copies. */
		var data = errorCorrectionLevel[ 1 ] << 3 | mask ,bits = data ,bit = 10;
		while( bit-- ) bits = bits << 1 ^ 1335 * ( bits >>> 9 );
		bits = 21522 ^ ( data << 10 | bits ); /* format mask 0x5412. */
		if( 0 != bits >>> 15 ) throw "Assertion error";
		bit = 6;
		while( bit-- ) setFunctionModule( 8, bit, getBit( bits, bit ) );
		setFunctionModule( 8, 7, getBit( bits, 6 ) );
		setFunctionModule( 8, 8, getBit( bits, 7 ) );
		setFunctionModule( 7, 8, getBit( bits, 8 ) );
		for( bit = 9; bit < 15; bit++ ) setFunctionModule( 14 - bit, 8, getBit( bits, bit ) );
		bit = 8;
		while( bit-- ) setFunctionModule( qrSize - 1 - bit, 8, getBit( bits, bit ) );
		for( bit = 8; bit < 15; bit++ ) setFunctionModule( 8, qrSize - 15 + bit, getBit( bits, bit ) );
		setFunctionModule( 8, qrSize - 8, !0 );
	}

	,drawFunctionPatterns = function() { /* reserved patterns and version bits. */
		var index = qrSize ,numAlign ,step ,alignPatPos = [] ,x ,y ,bits ,bit;
		while( index-- ) {
			setFunctionModule( 6, index, 0 == index % 2 );
			setFunctionModule( index, 6, 0 == index % 2 );
		}
		if( qrVersion > 1 ) {
			numAlign = 2 + ( qrVersion / 7 | 0 );
			step = ( ( qrVersion * 8 + numAlign * 3 + 5 ) / ( numAlign * 4 - 4 ) | 0 ) * 2;
			alignPatPos[ 0 ] = 6;
			index = numAlign;

			while( --index ) alignPatPos[ index ] = qrSize - 7 - ( numAlign - 1 - index ) * step; /* rightmost center: size - 7. */
		}
		var alignPatCount = alignPatPos.length;
		y = alignPatCount;
		while( y-- ) {
			x = alignPatCount;
			while( x-- )
				if( !( 0 == x && 0 == y ) && !( 0 == x && y == alignPatCount - 1 ) && !( x == alignPatCount - 1 && 0 == y ) )
					drawAlignmentPattern( alignPatPos[ x ], alignPatPos[ y ] );
		}
		drawFinderPattern( 3, 3 );
		drawFinderPattern( qrSize - 4, 3 );
		drawFinderPattern( 3, qrSize - 4 );
		drawFormatBits( 0 );
		if( qrVersion >= 7 ) {
			bits = qrVersion;
			bit = 12;
			while( bit-- ) bits = bits << 1 ^ 7973 * ( bits >>> 11 );
			bits = qrVersion << 12 | bits;
			if( 0 != bits >>> 18 ) throw "Assertion error";
			bit = 18;
			while( bit-- ) {
				x = qrSize - 11 + bit % 3;
				y = bit / 3 | 0;
				setFunctionModule( x, y, getBit( bits, bit ) );
				setFunctionModule( y, x, getBit( bits, bit ) );
			}
		}
	}

	,addEccAndInterleave = function( data ) { /* append ecc and interleave blocks. */
		if( data.length != getNumDataCodewords( qrVersion, errorCorrectionLevel ) ) throw "Invalid argument";

		var
		 numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ errorCorrectionLevel[ 0 ] ][ qrVersion ]
		,blockEccLen = ECC_CODEWORDS_PER_BLOCK[ errorCorrectionLevel[ 0 ] ][ qrVersion ]
		,rawCodewords = getNumRawDataModules( qrVersion ) / 8 | 0
		,numShortBlocks = numBlocks - rawCodewords % numBlocks
		,shortBlockLen = rawCodewords / numBlocks | 0
		,blocks = [] ,rsDiv ,dataOffset = 0
		,dataBlock ,ecc ,result = [];

		rsDiv = ( function( degree ) { /* reed-solomon generator polynomial. */
			var rootPower = 1 ,polynomial = [] ,i = degree;
			polynomial[ degree - 1 ] = 1;
			while( i-- ) {
				for( var j = 0; j < degree; j++ )
					polynomial[ j ] = reedSolomonMultiply( polynomial[ j ], rootPower ) ^ polynomial[ j + 1 ];
				rootPower = reedSolomonMultiply( rootPower, 2 );
			}
			return polynomial;
		} )( blockEccLen );

		for( var blockIndex = 0; blockIndex < numBlocks; blockIndex++ ) {
			dataBlock = data.slice( dataOffset, dataOffset + shortBlockLen - blockEccLen + ( blockIndex < numShortBlocks ? 0 : 1 ) );
			dataOffset += dataBlock.length;
			ecc = reedSolomonComputeRemainder( dataBlock, rsDiv );
			if( blockIndex < numShortBlocks ) dataBlock.push( 0 );
			blocks.push( dataBlock.concat( ecc ) );
		}

		for( var i = 0; i < blocks[ 0 ].length; i++ )
			for( var j = 0; j < blocks.length; j++ )
				if( i != shortBlockLen - blockEccLen || j >= numShortBlocks ) result.push( blocks[ j ][ i ] );
		return result;
	}

	,toUtf8ByteArray = function( text ) { /* utf-8 bytes. */
		text = encodeURI( text );
		for( var bytes = [] ,i = 0; i < text.length; i++ ) {
			if( "%" != text.charAt( i ) ) bytes.push( text.charCodeAt( i ) );
			else {
				bytes.push( parseInt( text.substr( i + 1, 2 ), 16 ) );
				i += 2;
			}
		}
		return bytes;
	}

	,getNumDataCodewords = function( version, ecc ) { /* payload capacity in bytes. */
		return ( getNumRawDataModules( version ) / 8 | 0 )
			- ECC_CODEWORDS_PER_BLOCK[ ecc[ 0 ] ][ version ] * NUM_ERROR_CORRECTION_BLOCKS[ ecc[ 0 ] ][ version ];
	}

	,setFunctionModule = function( x, y, value ) { /* write and reserve a module. */
		modules[ y ][ x ] = !!value;
		isFunction[ y ][ x ] = !0;
	}

	,makeBytes = function( bytes ) { /* byte segment. */
		for( var bits = [] ,i = 0; i < bytes.length; i++ ) appendBits( bytes[ i ], 8, bits );
		return { modeBits: 4, numBitsCharCount: [ 8, 16, 16 ], numChars: bytes.length, bitData: bits };
	}

	,makeNumeric = function( text ) { /* numeric segment. */
		if( !NUMERIC_REGEX.test( text ) ) throw "String contains non-numeric characters";
		var bits = [] ,i = 0 ,count;
		while( i < text.length ) {
			count = min( text.length - i, 3 );
			appendBits( parseInt( text.substr( i, count ), 10 ), 3 * count + 1, bits );
			i += count;
		}
		return { modeBits: 1, numBitsCharCount: [ 10, 12, 14 ], numChars: text.length, bitData: bits };
	}

	,getAlphanumericValue = function( text, index ) {
		return ALPHANUMERIC_CHARSET.indexOf( text.charAt( index ) );
	}

	,makeAlphanumeric = function( text ) { /* alphanumeric segment. */
		if( !ALPHANUMERIC_REGEX.test( text ) ) throw "String contains unencodable characters in alphanumeric mode";
		for( var bits = [] ,i = 0 ,value; i + 2 <= text.length; i += 2 ) {
			value = 45 * getAlphanumericValue( text, i ) + getAlphanumericValue( text, i + 1 );
			appendBits( value, 11, bits );
		}
		if( i < text.length ) appendBits( getAlphanumericValue( text, i ), 6, bits );
		return { modeBits: 2, numBitsCharCount: [ 9, 11, 13 ], numChars: text.length, bitData: bits };
	}

	,encodeText = function( text, ecc, boostEcl, mask ) { /* select segment mode and encode. */
		var segments = "" === text ? [] :
			NUMERIC_REGEX.test( text ) ? [ makeNumeric( text ) ] :
			ALPHANUMERIC_REGEX.test( text ) ? [ makeAlphanumeric( text ) ] :
			[ makeBytes( toUtf8ByteArray( text ) ) ];
		return encodeSegments( segments, ecc, boostEcl, mask );
	}

	,encodeMatrix = function( version, ecc, data, mask ) { /* build matrix and select mask. */
		var
		 row ,col ,direction = 1 ,bitIndex = 0
		,codewords ,currentMask ,score ,bestScore = 1e9;
		qrVersion = version;
		errorCorrectionLevel = ecc;
		qrMask = mask;
		qrSize = 4 * version + 17;
		row = qrSize;
		while( row-- ) {
			modules[ row ] = [];
			isFunction[ row ] = [];
		}
		drawFunctionPatterns();
		codewords = addEccAndInterleave( data );

		for( col = qrSize - 1; col > 0; col -= 2 ) {
			if( 6 == col ) col--;
			direction = - direction;
			row = direction < 0 ? qrSize - 1 : 0;
			for( var i = 0; i < qrSize; i++, row += direction ) {
				for( var moduleCol = col; moduleCol > col - 2; moduleCol-- ) {
					if( !isFunction[ row ][ moduleCol ] ) {
						modules[ row ][ moduleCol ] = getBit( codewords[ bitIndex >>> 3 ], 7 - ( bitIndex & 7 ) );
						bitIndex++;
					}
				}
			}
		}

		if( qrMask < 0 ) {
			currentMask = 8;
			while( currentMask-- ) {
				applyMask( currentMask );
				drawFormatBits( currentMask );
				score = getPenaltyScore();
				if( score < bestScore ) {
					bestScore = score;
					qrMask = currentMask;
				}
				applyMask( currentMask );
			}
		}
		applyMask( qrMask );
		drawFormatBits( qrMask );
		isFunction = [];
	}

	,encodeSegments = function( segments, ecc, boostEcl, mask, minVersion, maxVersion ) { /* select version, pad payload and encode. */
		if( undefined === minVersion ) minVersion = 1;
		if( undefined === maxVersion ) maxVersion = 40;
		if( undefined === mask ) mask = - 1;
		if( undefined === boostEcl ) boostEcl = true;
		if( !( minVersion >= 1 && minVersion <= maxVersion && maxVersion <= 40 ) || mask < - 1 || mask > 7 ) throw "Invalid value";

		var bits = [] ,bytes = [] ,padByte = 236 ,version = minVersion ,totalBits ,capacity;
		var i ,segment ,segmentBits ,levels;
		while( !0 ) {
			totalBits = getTotalBits( segments, version );
			if( totalBits <= 8 * getNumDataCodewords( version, ecc ) ) break;
			if( version >= maxVersion ) throw "Data too long";
			version++;
		}

		if( boostEcl ) {
			levels = [ eccLevels.H, eccLevels.Q, eccLevels.M ];
			i = levels.length;
			while( i-- )
				if( totalBits <= 8 * getNumDataCodewords( version, levels[ i ] ) ) ecc = levels[ i ];
		}

		for( i = 0; i < segments.length; i++ ) {
			segment = segments[ i ];
			appendBits( segment.modeBits, 4, bits );
			appendBits( segment.numChars, numCharCountBits( segment, version ), bits );
			segmentBits = segment.bitData;
			for( var j = 0; j < segmentBits.length; j++ ) bits.push( segmentBits[ j ] );
		}
		if( bits.length != totalBits ) throw "Assertion error";
		capacity = 8 * getNumDataCodewords( version, ecc );
		if( bits.length > capacity ) throw "Assertion error";
		appendBits( 0, min( 4, capacity - bits.length ), bits );
		appendBits( 0, ( 8 - bits.length % 8 ) % 8, bits );
		if( 0 != bits.length % 8 ) throw "Assertion error";
		while( bits.length < capacity ) {
			appendBits( padByte, 8, bits );
			padByte ^= 253;
		}

		i = bits.length;
		while( i-- ) bytes[ i >>> 3 ] |= bits[ i ] << 7 - ( 7 & i );
		return encodeMatrix( version, ecc, bytes, mask );
	};

	return ( function() { /* svg generator */

		function ishex( c ) {

			return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test( c );
		}

		function svg( n, a ) {

			n = document.createElementNS( ns, n );

			for( var o in a || { } ) {

				n.setAttribute( o, a[ o ] );
			}

			return n;
		}

		var
		 r ,x ,y ,d
		,ns = 'http://www.w3.org/2000/svg'
		,path = ''
		,q = ( 'string' == typeof Q ) ? { msg: Q } : Q || { }
		,p = q.pal || [ '#000' ]
		,dm = abs( q.dim ) || 256
		,pd = abs( q.pad )
		,mx
		,fg = p[ 0 ]
		,bg = p[ 1 ]
		,optimized = q.vrb ? 0 : 1
		,s
		;

		pd = pd > -1 ? pd : 4;
		mx = [ 1, 0, 0, 1, pd, pd ];
		fg = ishex( fg ) ? fg : '#000';
		bg = ishex( bg ) ? bg : 0;

		encodeText( q.msg || '', eccLevels[ q.ecl ] || eccLevels.M, q.ecb == 0 ? 0 : 1, q.mtx );

		s = qrSize + 2 * pd;
		y = qrSize;



		while( y-- ) { /* render optimized or verbose svg */

			d = 0, x = qrSize;
			while( x-- ) {
				if( modules[ y ][ x ] ) {
					if( optimized ) {
						d++;
						if( !modules[ y ][ x - 1 ] )
							path += 'M' + x + ',' + y + 'h' + d + 'v1h-' + d + 'v-1z', d = 0;
					} else path += 'M' + x + ',' + y + 'h1v1h-1v-1z';
				}
			}
		}

		r = svg('svg', {

			 'viewBox'		: [ 0, 0, s, s ].join(' ')
			,'width'		:  dm
			,'height'		:  dm
			,'fill'			:  fg
			,'shape-rendering'	: 'crispEdges'
			,'xmlns'		:  ns
			,'version'		: '1.1'
		} );

		if( bg ) r.appendChild( svg( 'path', {

			 'fill'			:  bg
			,'d'			: 'M0,0V' + s + 'H' + s + 'V0H0Z'
		} ) );

		r.appendChild( svg( 'path', {

			 'transform'		: 'matrix(' + mx + ')'
			,'d'			:  path
		} ) );

		return r;
	} )();
}
