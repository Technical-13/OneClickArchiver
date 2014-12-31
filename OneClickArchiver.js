//<nowiki>
$(document).ready( function () {
	if ( ( $( '#ca-addsection' ).length > 0 ||
		$.inArray( 'Non-talk pages that are automatically signed', mw.config.get( 'wgCategories' ) )  >= 0 ) &&
		mw.config.get( 'wgAction' ) === 'view' &&
		$.inArray( 'Pages that should not be manually archived', mw.config.get( 'wgCategories' ) ) === -1 ) {
		var OCAstate = mw.user.options.get( 'userjs-OCA-enabled', 'true' );
		var pageid = mw.config.get( 'wgArticleId' );
		var errorLog = {errorCount: 0};
		new mw.Api().get( {
			action: 'query',
			pageids: pageid,
			rvsection: 0,
			prop: [ 'revisions', 'info' ],
			rvprop: "content",
			indexpageids: 1,
			continue: ''
		} ).done( function ( response0 ) {
			var content0 = response0.query.pages[pageid].revisions[0]['*'];
 
			/* counter *///Get the counter value
			var counterRegEx = new RegExp( '\\| *counter *= *(\\d+)' );
			var counter = counterRegEx.exec( content0 );
			if ( counter === null || counter === undefined ) {
				counter = 1;
				errorLog.errorCount++;
				errorLog.counter = 'Counter<br />defaulted to<br /><br />' + counter;
			} else {
				counter = counter[1];
				var archiveNum = counter;
			}
 
			/* archiveName *///Get the archiveName value
			var archiveNameRegEx = /\| *archive *= *(.*\%\(counter\)d.*?) *(-->)?/;
			var archiveName = archiveNameRegEx.exec( content0 );
			var rootBase = mw.config.get( 'wgPageName' )
					.replace( /\/.*/g, '' )// Chop off the subpages
					.replace( /_/g, ' ' );// Replace underscores with spaces
			if ( archiveName === null || archiveName === undefined ) {
				archiveName = rootBase + '/Archive ' + counter;
				errorLog.errorCount++;
				errorLog.archiveName = 'Archive name<br />defaulted to<br /><br />' + archiveName;
			} else {
				var year = new Date().getFullYear();
				var month = new Date().getMonth();
 
				var archiveName = archiveName[1]
					.replace( /\| *archive *= */, '' )
					.replace( /\%\(year\)d/g, year )
					.replace( /\%\(month\)d/g, month )
					.replace( /\%\(monthname\)s/g, mw.config.get( 'wgMonthNames' )[month+1] )
					.replace( /\%\(monthnameshort\)s/g, mw.config.get( 'wgMonthNamesShort' )[month+1] )
					.replace( /\%\(counter\)d/g, archiveNum );
				var archiveBase = archiveName
					.replace( /\/.*/, '' )// Chop off the subpages
					.replace( /_/g, ' ' );// Replace underscores with spaces
				var archiveSub = archiveName
					.replace( /_/g, ' ' )// Replace underscores with spaces
					.replace( archiveBase, '' );// Chop off the base pagename
				if ( archiveBase != rootBase ) {
					errorLog.errorCount++;
					errorLog.archiveName = 'Archive name mismatch:<br /><br />Found: ' + archiveName;
					errorLog.archiveName += '<br />Expected: ' + rootBase.replace( '_', ' ' ) + archiveSub + '<br /><br />';
				}
			}
			
			/* archivepagesize */// Get the size of the destination archive from the API
			new mw.Api().get( {
				action: 'query',
				titles: archiveName,
				prop: 'revisions',
				rvprop: 'size|content',
				rvexpandtemplates: '',
				rvparse: '',
				rawcontinue: '',
				format: 'json'
			} ).done( function ( archivePageData ) {
				var archivePageSize = 0;
				if ( archivePageData.query.pages[-1] === undefined ) {
					for ( var a in archivePageData.query.pages ) {
						archivePageSize = parseInt( archivePageData.query.pages[a].revisions[0].size, 10 );
					}
				} else {
					archivePageSize = -1;
					errorLog.errorCount++;
					errorLog.archivePageSize = '<a class="new" href="' + mw.util.wikiGetlink( archiveName, { action:'edit', redlink:'1' } ) + '" title="' + archiveName + '">' + archiveName + '</a>" does not exist.';
				}
 
				/* maxarchivesize */// Get the defined max archive size from template
				var maxArchiveSizeRegEx = new RegExp( '\\| *maxarchivesize *= *(\\d+K?)' );
				var maxArchiveSize = maxArchiveSizeRegEx.exec( content0 );
				if ( maxArchiveSize === null || maxArchiveSize[1] === undefined ) {
					maxArchiveSize = parseInt( 153600, 10 );
					errorLog.errorCount++;
					errorLog.maxArchiveSize = 'Maximum archive size defaulted to<br /><br />' + maxArchiveSize;
				} else if ( maxArchiveSize[1].slice( -1 ) == "K" && $.isNumeric( maxArchiveSize[1].slice( 0, maxArchiveSize[1].length-1 ) ) ) {
					maxArchiveSize = parseInt( maxArchiveSize[1].slice( 0, maxArchiveSize[1].length-1 ), 10 )*1024;
				} else if ( $.isNumeric( maxArchiveSize[1].slice() ) ) {
					maxArchiveSize = parseInt( maxArchiveSize[1].slice(), 10 );
				}
				
				/* pslimit */// If maxArchiveSize is defined, and archivePageSize >= maxArchiveSize increment counter and redfine page name.
				if ( !errorLog.maxArchiveSize && archivePageSize >= maxArchiveSize ) {
					counter++;
					archiveName = archiveNameRegEx.exec( content0 );
					var archiveName = archiveName[1]
						.replace( /\| *archive *= */, '' )
						.replace( /\%\(year\)d/g, year )
						.replace( /\%\(month\)d/g, month )
						.replace( /\%\(monthname\)s/g, mw.config.get( 'wgMonthNames' )[month+1] )
						.replace( /\%\(monthnameshort\)s/g, mw.config.get( 'wgMonthNamesShort' )[month+1] )
						.replace( /\%\(counter\)d/g, counter );
					var oldCounter = counterRegEx.exec( content0 );
					var newCounter = '|counter=1';
					if ( oldCounter !== null && oldCounter !== undefined ) {
						newCounter = oldCounter[0].replace( oldCounter[1], counter );
						oldCounter = oldCounter[0];
					} else {
						errorLog.errorCount++;
						errorLog.newCounter = 'newCounter<br />defaulted to<br /><br />' + newCounter;
					}
				}
	 
				/* archiveheader */// Get the defined archive header to place on archive page if it doesn't exist
				var archiveHeaderRegEx = new RegExp( '\\| *archiveheader *= *(\{\{[^\r\n]*\}\})' );
				var archiveHeader = archiveHeaderRegEx.exec( content0 );
				if ( archiveHeader === null || archiveHeader === undefined ) {
					archiveHeader = "{{Aan}}";
					errorLog.errorCount++;
					errorLog.archiveHeader = 'Archive header<br />defaulted to<br /><br />' + archiveHeader;
				} else {
					archiveHeader = archiveHeader[1];
				}
	 
				/* headerlevel *///Get the headerlevel value or default to '2'
				var headerLevelRegEx = new RegExp( '\\| *headerlevel *= *(\\d+)' );
				var headerLevel = headerLevelRegEx.exec( content0 );
				if ( headerLevel === null || headerLevel === undefined ) {
					headerLevel = 2;
					errorLog.errorCount++;
					errorLog.headerLevel = 'Header level<br />defaulted to<br /><br />' + headerLevel;
				} else {
					headerLevel = parseInt( headerLevel[1] );
				}
	 
				/* debug */// Table to report the values found.
				if ( mw.config.get( 'debug' ) === true ) {
					var OCAreport = '<table style="width: 100%;" border="1"><tr><th>Config</th><th>value</th></tr>';
					OCAreport += '<tr><td>Counter</td><td style="text-align: center;';
					if ( errorLog.counter ) { OCAreport += ' background-color: #FFEEEE;">' + errorLog.counter; }
						else { OCAreport += '">' + counter; }
					OCAreport += '</td></tr><tr><td>Archive<br />name</td><td style="text-align: center;';
					if ( errorLog.archiveName ) { OCAreport += ' background-color: #FFEEEE;">' + errorLog.archiveName; }
						else { OCAreport += '">' + archiveName; }
					OCAreport += '</td></tr><tr><td>Header<br />Level</td><td style="text-align: center;';
					if ( errorLog.headerLevel ) { OCAreport += ' background-color: #FFEEEE;">' + errorLog.headerLevel; }
						else { OCAreport += '">' + headerLevel }
					OCAreport +=  '</td></tr><tr><td>Archive<br />header</td><td style="text-align: center;';
					if ( errorLog.archiveHeader ) { OCAreport += ' background-color: #FFEEEE;">' + errorLog.archiveHeader; }
						else { OCAreport += '">' + archiveHeader }
					OCAreport +=  '</td></tr><tr><td>Max<br />archive<br />size</td><td style="text-align: center;';
					if ( errorLog.maxArchiveSize ) { OCAreport += ' background-color: #FFEEEE;">' + errorLog.maxArchiveSize; }
						else { OCAreport += '">' + maxArchiveSize }
					OCAreport +=  '</td></tr><tr><td>Current<br />archive<br />size</td><td style="text-align: center;';
					if ( errorLog.archivePageSize ) { OCAreport += ' background-color: #FFEEEE;">' + errorLog.archivePageSize; }
						else { OCAreport += '">' + archivePageSize }
					OCAreport +=  '</td></tr><tr><td colspan="2" style="font-size: larger; text-align: center;"><a href="/wiki/User:Equazcion/OneClickArchiver" title="User:Equazcion/OneClickArchiver">Documentation</a></td></tr></table>';
					mw.notify( $( OCAreport ), { title: 'OneClickArchiver report!', tag: 'OCA', autoHide: false } );
				}
	 
				if ( ( errorLog.counter || errorLog.archiveName ) && OCAstate === 'true' ) {
					var OCAerror = '<p>The following errors detected:<br />';
					if ( errorLog.counter ) { OCAerror += '<b style="font-size: larger; color: #FF0000;">&bull;</b>&nbsp;Unable to find <b>|counter=</b><br />'; }
					if ( errorLog.archiveName && errorLog.archiveName.search( 'defaulted to' ) !== -1 ) { OCAerror += '<b style="font-size: larger; color: #FF0000;">&bull;</b>&nbsp;Unable to find <b>|archive=</b><br />'; }
					if ( errorLog.archiveName && errorLog.archiveName.search( 'mismatch' ) !== -1 ) { OCAerror += '<b style="font-size: larger; color: #FF0000;">&bull;</b>&nbsp;Archive name mismatch detected.<br />'; }
					if ( errorLog.headerLevel ) { OCAerror += '&nbsp; Unable to find <b>|headerlevel=</b><br />&nbsp; &nbsp;Default value: <b>2</b><br />'; }
					if ( errorLog.archiveHeader ) { OCAerror += '&nbsp; Unable to find <b>|archiveheader=</b><br />&nbsp; &nbsp;Default value: <b>"{{Aan}}"</b><br />'; }
					if ( errorLog.maxArchiveSize ) { OCAerror += '&nbsp; Unable to find <b>|maxarchivesize=</b><br />&nbsp; &nbsp;Default value: <b>153600</b><br />'; }
					if ( errorLog.counter || errorLog.archiveName ) { OCAerror += '<br /><b style="font-size: larger; color: #FF0000;">&bull;</b>&nbsp;Causing the script to abort.<br />'; }
					OCAerror += '<br /><span style="font-size: larger;">Please, see <a href="/wiki/User:Equazcion/OneClickArchiver" title="User:Equazcion/OneClickArchiver">the documentation</a> for details.</span></p>';
					mw.notify( $( OCAerror ), { title: 'OneClickArchiver errors!', tag: 'OCAerr', autoHideSeconds: 30 } );
				}
	 
				if ( ( errorLog.counter || errorLog.archiveName ) &&
					mw.config.get( 'debug' ) === true && confirm( 'Click [OK] to abort or [Cancel] to attempt running with default values.' ) === true ) {
					/* Abort script */
				} else {
	 
					$( 'h' + headerLevel + ' span.mw-headline' ).each( function( i, val ) {
						var sectionName = $( this ).text();
						var editSectionUrl = $( this ).parent().find( '.mw-editsection a:first' ).attr( 'href' );
						var sectionReg = /&section=(.*)/;
						var sectionRaw = sectionReg.exec( editSectionUrl );
						if ( sectionRaw != null && sectionRaw[1].indexOf( 'T' ) < 0 ) {
							var sectionNumber = parseInt( sectionRaw[1] );
							if ( $( this ).parent().prop( 'tagName' ) == 'H' + headerLevel ) {
	 
								$( this ).parent( 'h' + headerLevel ).append( ' <div style="font-size: 0.6em; font-weight: bold; float: right;"> | <a id="' + sectionNumber +
									'" href="#archiverLink" class="archiverLink">' + 'Archive' + '</a></div>' );
	 
								$( this ).parent( 'h' + headerLevel ).find( 'a.archiverLink' ).click( function() {
	 
									var mHeaders = '<span style="color: #444;">Retrieving headers...</span>';
									var mSection = 'retrieving section content...';
									var mPosting = '<span style="color: #040">Content retrieved,</span> performing edits...';
									var mPosted = '<span style="color: #080">Archive appended...</span>';
									var mCleared = '<span style="color: #080">Section cleared...</span>';
									var mReloading = '<span style="color: #008">All done! </span><a href="#archiverLink" onClick="javascript:location.reload();" title="Reload page">Reloading</a>...';
	 
									$( 'body' ).append( '<div class="overlay" style="background-color: #000; opacity: 0.4; position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 500;"></div>' );					
	 
									$( 'body' ).prepend( '<div class="arcProg" style="font-weight: bold; box-shadow: 7px 7px 5px #000; font-size: 0.9em; line-height: 1.5em; z-index: 501; opacity: 1; position: fixed; width: 50%; left: 25%; top: 30%; background: #F7F7F7; border: #222 ridge 1px; padding: 20px;"></div>' );
	 
									$( '.arcProg' ).append( '<div>' + mHeaders + '</div>' );
	 
									$( '.arcProg' ).append( '<div>' + 'Archive name <span style="font-weight: normal; color: #036;">' + archiveName + '</span> <span style="color: darkgreen;">found</span>, ' + mSection + '</div>' );
									new mw.Api().get( {
										action: 'query',
										pageids: pageid,
										rvsection: sectionNumber,
										prop: [ 'revisions', 'info' ],
										rvprop: 'content',
										indexpageids: 1,
										format: 'json',
										continue: ''
									} ).done( function ( responseSection ) {
										var sectionContent = responseSection.query.pages[pageid].revisions[0]['*'];
										$( '.arcProg' ).append( '<div>' + mPosting + '</div>' );
	 
										var dnau = sectionContent.match( /<!-- \[\[User:DoNotArchiveUntil\]\] ([\d]{2}):([\d]{2}), ([\d]{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) ([\d]{4}) \(UTC\) -->/ ); 
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
											var dnauAbortMsg = '<p>This section has been marked \"Do Not Archive Until\" ' + dnau + ', so archiving was aborted.<br /><br /><span style="font-size: larger;">Please, see <a href="/wiki/User:Equazcion/OneClickArchiver" title="User:Equazcion/OneClickArchiver">the documentation</a> for details.</span></p>';
											mw.notify( $( dnauAbortMsg ), { title: 'OneClickArchiver aborted!', tag: 'OCAdnau', autoHide: false } );
										} else {
											var archiveAction = 'adding';
											if ( archivePageSize === -1 || ( archivePageSize >= maxArchiveSize && !errorLog.maxArchiveSize ) ) {
												sectionContent = archiveHeader + '\n\n' + sectionContent;
												archiveAction = 'creating'
												mPosted = '<span style="color: #080">Archive created...</span>';
											} else {
												sectionContent = '\n\n{{Clear}}\n' + sectionContent;
											}
	 
											if ( dnau != null ) {
												sectionContent = sectionContent.replace( /<!-- \[\[User:DoNotArchiveUntil\]\] ([\d]{2}):([\d]{2}), ([\d]{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) ([\d]{4}) \(UTC\) -->/g, '' );
											}
											
											new mw.Api().postWithToken( 'edit', {
												action: 'edit',
												title: archiveName,
												appendtext: sectionContent,
												summary: '[[User:Equazcion/OneClickArchiver|OneClickArchiver]] ([[User:Technical_13/SandBox/OneClickArchiver.js|β]]) ' + archiveAction + ' [[' + archiveName + '#' + sectionName + '|' + sectionName + ']]'
											} ).done( function ( archived ) {
												$( '.arcProg' ).append( '<div class="archiverPosted">' + mPosted + '</div>' );
												new mw.Api().postWithToken( 'edit', {
													action: 'edit',
													section: sectionNumber,
													pageid: pageid,
													text: '',
													summary: '[[User:Equazcion/OneClickArchiver|OneClickArchiver]] ([[User:Technical_13/SandBox/OneClickArchiver.js|β]]) archived [[Special:Diff/' + archived.edit.newrevid + '|' + sectionName + ']] to [[' + archiveName + '#' + sectionName + '|' + archiveName + ']]'
												} ).done( function () {
													$( '.arcProg' ).append( '<div class="archiverCleared">' + mCleared + '</div>' );
													if ( archivePageSize >= maxArchiveSize && !errorLog.maxArchiveSize ) {
														var mUpdated = '<span style="color: #080">Counter updated...</span>';
														new mw.Api().postWithToken( 'edit', {
															action: 'edit',
															section: 0,
															pageid: pageid,
															text: content0.replace( oldCounter, newCounter ),
															summary: '[[User:Equazcion/OneClickArchiver|OneClickArchiver]] ([[User:Technical_13/SandBox/OneClickArchiver.js|β]]) updating counter.'
														} ).done( function () {
															$( '.arcProg' ).append( '<div class="archiverPosted">' + mUpdated + '</div>' );
															$( '.arcProg' ).append( '<div>' + mReloading + '</div>' );
															location.reload();
														} );
													} else {
														$( '.arcProg' ).append( '<div>' + mReloading + '</div>' );
														location.reload();
													}
												} );
											} );
										}
									} );
								} );
							}
						}
					} );
				}
			} );
		} );
		var linkTextD = 'OCA - on', linkDescD = 'Disable OneClickArchiver on this page';
		var linkTextE = 'OCA - off', linkDescE = 'Enable OneClickArchiver on this page';
		var linkText = linkTextD, linkDesc = linkDescD;
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
			$( 'div.archiverDiv' ).css( 'display', function ( i, val ) {
				return val === 'none' ? '' : 'none';
			});
			/* Toggle the toggle link */
			$( 'li#pt-OCA a' ).html( function ( i, val ) {
				return val === linkTextD ? linkTextE : linkTextD;
			});
			/* Toggle the toggle description */
			$( 'li#pt-OCA a' ).attr( 'title', function ( i, val ) {
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
	}
} );
//</nowiki>
