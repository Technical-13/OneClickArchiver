$(document).ready( function () {
	if ( ( $( '#ca-addsection' ).length > 0 ||
		( $.inArray( 'Non-talk pages that are automatically signed', mw.config.get( 'wgCategories' ) )  >= 0 &&
		mw.config.get( 'wgAction' ) == 'view' ) ) &&
		$.inArray( 'Pages that should not be manually archived', mw.config.get( 'wgCategories'  ) ) === -1 ) {
		var request0 = {
			action: 'query',
			titles: mw.config.get( 'wgPageName' ),
			rvsection: 0,
			prop: 'revisions|info',
			rvprop: "content",
			indexpageids: 1,
			format: 'json'
		};
		$.get( mw.config.get( 'wgScriptPath' ) + '/api.php', request0, function( response0 ) {
			var content0 = response0.query.pages.revisions[0]['*'];
			var headerLevelRegEx = new RegExp( '\\| *headerlevel *= *(\\d+)' );
			var headerLevel = headerLevelRegEx.exec( content0 );
			if ( headerLevel === null || headerLevel === undefined ) {
				headerLevel = 2;
			} else {
				headerLevel = parseInt( headerLevel[1] );
			}
			$( 'h' + headerLevel + ' span.mw-headline' ).each( function( i, v ) {
				var editSectionUrl = $( this ).parent().find( '.mw-editsection a:first' ).attr( 'href' );
				var sectionReg = /&section=(.*)/;
				var sectionRaw = sectionReg.exec( editSectionUrl );
				if ( sectionRaw != null && sectionRaw[1].indexOf( 'T' ) < 0 ) {
					var section = parseInt( sectionRaw[1] );
					if ( $( this ).parent().prop( 'tagName' ) == 'H' + headerLevel ) {
	 
						$( this ).parent( 'h' + headerLevel ).append( ' <div class="archiverDiv" style="font-size: 0.6em; font-weight: bold; float: right;"> | <a id="' + section +
							'" href="#archiverLink" class="archiverLink">' + 'Archive' + '</a></div>' );
	 
						$( this ).parent( 'h' + headerLevel ).find( 'a.archiverLink' ).click( function() {
	 
							var mHeaders = '<span style="color: #444;">Retrieving headers...</span>';
							var mSection = 'retrieving section content...';
							var mPosting = '<span style="color: #040">Content retrieved,</span> performing edits...';
							var mPosted = '<span style="color: #080">Archive appended...</span>';
							var mCleared = '<span style="color: #080">Section cleared...</span>';
							var mReloading = '<span style="color: #008">All done! </span>Reloading...';
	 
							$( 'body' ).append( '<div class="overlay" style="background-color: #000; opacity: 0.4; position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 500;"></div>' );					
	 
							$( 'body' ).prepend( '<div class="arcProg" style="font-weight: bold; box-shadow: 7px 7px 5px #000; font-size: 0.9em; line-height: 1.5em; z-index: 501; opacity: 1; position: fixed; width: 50%; left: 25%; top: 30%; background: #F7F7F7; border: #222 ridge 1px; padding: 20px;"></div>' );
	 
							$( '.arcProg' ).append( '<div>' + mHeaders + '</div>' );
	 
							var regexObject3 = new RegExp( '\\| *counter *= *(\\d+)' );
							var counter = regexObject3.exec( content0 );
							if ( counter === null || counter === undefined ) {
								$( '.arcProg' ).remove();
								$( '.overlay' ).remove();
								alert( 'No archive counter was detected on this page, so archiving was aborted.\n\n\tSee User:Equazcion/OneClickArchiver for details.' );
							} else {
								var archiveNum = counter[1];
	 
								var archiveNameReg = /\| *archive *= *(.*\%\(counter\)d.*?) *(-->)?/;
								var archiveNameRegMatch = archiveNameReg.exec( content0 );
								if ( archiveNameRegMatch === null || archiveNameRegMatch === undefined ) {
									$( '.arcProg' ).remove();
									$( '.overlay' ).remove();
									alert( 'No archive name was detected on this page, so archiving was aborted.\n\n\tSee User:Equazcion/OneClickArchiver for details.' );
								} else {
									var year = new Date().getFullYear();
									var month = new Date().getMonth();
	 
									var rootBase = mw.config.get( 'wgPageName' )
										.replace( /\/.*/g, '' )
										.replace( /_/g, ' ' );
									var archiveName = archiveNameRegMatch[1]
										.replace( /\| *archive *= */, '' )
										.replace( /\%\(year\)d/g, year)
										.replace( /\%\(month\)d/g, month)
										.replace( /\%\(monthname\)s/g, mw.config.get( 'wgMonthNames' )[month+1] )
										.replace( /\%\(monthnameshort\)s/g, mw.config.get( 'wgMonthNamesShort' )[month+1] )
										.replace( /\%\(counter\)d/g, archiveNum);
									var archiveBase = archiveName
										.replace( /\/.*/, '' )
										.replace( /_/g, ' ' );
									var archiveSub = archiveName
										.replace( /_/g, ' ' )
										.replace( archiveBase, '' );
									if( archiveBase != rootBase ) {
										$( '.arcProg' ).remove();
										$( '.overlay' ).remove();
										alert( 'Archiving was aborted due to archive page name mismatch:\n\n\tFound:\t\t' + archiveName + '\n\tExpected:\t' + mw.config.get( 'wgPageName' ).replace( '_', ' ' ) + archiveSub + '\n\n\n\tSee User:Equazcion/OneClickArchiver for details.' );
									} else {
										$( '.arcProg' ).append( '<div>' + 'Archive name <span style="font-weight: normal; color: #036;">' + archiveName + '</span> <span style="color: darkgreen;">found</span>, ' + mSection + '</div>' );
	 
										var request5 = {
											action: 'query',
											titles: mw.config.get( 'wgPageName' ),
											rvsection: section,
											prop: 'revisions|info',
											intoken: 'edit',
											rvprop: 'content',
											indexpageids: 1,
											dataType: 'xml',
											format: 'xml'
										};
	 
										$.get( mw.config.get( 'wgScriptPath' ) + '/api.php', request5, function( response5 ) {
	 
											$( '.arcProg' ).append( '<div>' + mPosting + '</div>' );
	 
											var dnau = $( response5 ).find( 'rev' ).text().match( /<!-- \[\[User:DoNotArchiveUntil\]\] ([\d]{2}):([\d]{2}), ([\d]{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) ([\d]{4}) \(UTC\) -->/ ); 
											if ( dnau === null || dnau === undefined ) {
												var dnauDate = Date.now();
												dnau = null;
											} else {
												dnau = dnau[1] + ':' + dnau[2] + ' ' + dnau[3] + ' ' + dnau[4] + ' ' + dnau[5];
												var dnauDate = new Date( dnau );
												dnauDate = dnauDate.valueOf();
											}
	 
											if ( dnauDate > Date.now() ) {
												$( '.arcProg' ).remove();
												$( '.overlay' ).remove();
												alert( 'This section has been marked \"Do Not Archive Until\" " + dnau + ", so archiving was aborted.\n\n\tSee User:Equazcion/OneClickArchiver for details.' );
											} else {
												var contentSection = '\n\n{{Clear}}\n' + $( response5 ).find( 'rev' ).text();
	 
												if ( dnau != null ) {
													contentSection = contentSection.replace( /<!-- \[\[User:DoNotArchiveUntil\]\] ([\d]{2}):([\d]{2}), ([\d]{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) ([\d]{4}) \(UTC\) -->/g, '' );
												}
												new mw.Api().postWithToken( 'edit', {
													action: 'edit',
													title: archiveName,
													appendtext: contentSection,
													summary: '[[User:Equazcion/OneClickArchiver|OneClickArchiver]] ([[User:Technical_13/SandBox/OneClickArchiver.js|β]]) adding 1 discussion'
												} ).done( function() {
													$( '.arcProg' ).append( '<div class="archiverPosted">' + mPosted + '</div>' );
													new mw.Api().postWithToken( 'edit', {
														action: 'edit',
														section: section,
														title: mw.config.get( 'wgPageName' ),
														text: '',
														summary: '[[User:Equazcion/OneClickArchiver|OneClickArchiver]] ([[User:Technical_13/SandBox/OneClickArchiver.js|β]]) archived 1 discussion to [[' + archiveName + ']]',
													} ).done( function() {
														$( '.arcProg' ).append( '<div class="archiverCleared">' + mCleared + '</div>' );
														$( '.arcProg' ).append( '<div>' + mReloading + '</div>' );
														location.reload();
													} );
												} );
											}
										} );
									}
								}
							}
						} );
					}
				}
			} );
			var linkTextD = 'OCA - on', linkDescD = 'Disable OneClickArchiver on this page';
			var linkTextE = 'OCA - off', linkDescE = 'Enable OneClickArchiver on this page';
			var linkText = linkTextD, linkDesc = linkDescD;
			var OCAstate = mw.user.options.get( 'userjs-OCA-enabled', 'true' );
			if ( OCAstate === 'false' ) {
				linkText = linkTextE, linkDesc = linkDescE;
				$( 'div.archiverDiv' ).css( 'display', 'none' );
			}
			var archiverToggle = mw.util.addPortletLink(
				'p-cactions',
				'#archiverLink',
				linkText,
				'pt-OCA',
				linkDesc,
				'o',
				null
			);
			$( archiverToggle ).click( function ( e ) {
				e.preventDefault();
				/* Toggle the archiveLinks */
				$( 'div.archiverDiv' ).css( 'display', function (i, val) {
					return val === 'none' ? '' : 'none';
				});
				/* Toggle the toggle link */
				$( 'li#pt-OCA a' ).html( function ( i, val ) {
					return val === linkTextD ? linkTextE : linkTextD;
				});
				/* Toggle the toggle description */
				$( 'li#pt-OCA a' ).attr( 'title', function (i, val) {
					return val === linkDescD ? linkDescE : linkDescD;
				});
				/* Toggle default state */
				new mw.Api().postWithToken( 'options', {
					action: 'options',
					optionname: 'userjs-OCA-enabled',
					optionvalue: OCAstate === 'true' ? 'false' : 'true'
				} ).done( function() {
					var resultMsg = 'OneClickArchiver is now ' + ( OCAstate === 'true' ? 'disabled' : 'enabled' ) + ' by default.';
					mw.notify(resultMsg);
					OCAstate = OCAstate === 'true' ? 'false' : 'true';
				} );
			} );
		} );
	}
} );
