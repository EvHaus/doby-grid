# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.0-beta1] - 2016-04-26
### Deprecated
- Older builds are no longer shipped with the app. The latest build is now available in `build/latest/`.

### Changed
- Library changes are now tracked in `CHANGELOG.md`

### Fixed
- Right-clicking on the same cell will no longer cause the menu to appear multiple times [[#191](https://github.com/EvNaverniouk/doby-grid/issues/191)]
- Exporting tables to HTML will now correctly escape HTML tags [[#193](https://github.com/EvNaverniouk/doby-grid/issues/193)]
- Fixed an issue with invalid cache validation [[#199](https://github.com/EvNaverniouk/doby-grid/pull/199)]

----

## [0.1.3] - 2016-01-03
### Fixed
- Renamed the Range class to CellRange to avoid conflicts with the native window.Range object
- Made some improvements to remote data fetching with large data sets (Thanks @AlanUnderwood!)

----

## [0.1.2] - 2015-11-17

### Fixed
- Fixed an issue with aggregator rows not being rendered when aggregators are added using setColumns or setOptions.
- Fixed an issue with the jquery.event.drag-drop Bower dependency (Thanks @mminer!)

----

For older releases see https://github.com/EvNaverniouk/doby-grid/releases
