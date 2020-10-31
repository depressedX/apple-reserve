var sVer = chrome.runtime.getManifest().version,
  sChangelog =
    '<h3 id="changelog">What\'s new in Version </li>' + sVer + '</h3>' +
    '<ul>' +
      '<li>Added support for forms that require bubbling (v9.6.0)</li>' +
      '<li>Upgraded jQuery from v3.3.1 to v3.5.1 (v9.6.1)</li>' +
    '</ul>' +
    '<h4><a href="changelog.txt" target="_blank">Version History</a> &raquo;</h4>';
