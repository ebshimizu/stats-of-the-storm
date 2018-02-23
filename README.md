# Stats of the Storm

A flexible stat tracker for Heroes of the Storm.

Provides the ability to track individual stats, team stats in a league, and overall statistics
for a league.

For a list of features and additional installation instructions, check out the [project page](https://ebshimizu.github.io/stats-of-the-storm/).

## Installation
Stats of the Storm has only been tested and built for Windows 10 systems.
If you'd like to help get this to run on OS X and Linux, check out the Development section below.

Check out the [Releases Page](https://github.com/ebshimizu/hots-analysis/releases) to download the latest installer.

## Development
Here's what you'll need to develop the app.

* Install node
* Install Python 2 (must be 2, and you should also put it in your path)
* Install [pyinstaller](http://www.pyinstaller.org/)
* Install electron globally: `npm install -g electron`
* Clone the repository and initialize the submodules
* Run `npm install` inthe repository root (the one with `package.json` in it)
* To package the parser, navigate to the `./parser/heroprotocol` folder and run `node ../package_parser.js`
* Launch the Electron application from the repository root by running `electron .`

### Why is PyInstaller Required?
Stats of the Storm doesn't assume that users have Python installed on their system. Additionally,
there are issues with running python files from the Electron ASAR archives, and it is easier
to package the parser as a single executable file.

## Third-Party Libraries
* [heroprotocol](https://github.com/Blizzard/heroprotocol)
* [heroes-talents](https://github.com/heroespatchnotes/heroes-talents)
* [NeDB](https://github.com/louischatriot/nedb)
* [Semantic UI](https://semantic-ui.com/)
* [datepicker](https://github.com/fengyuanchen/datepicker)
* [jquery.floatThead](https://github.com/mkoryak/floatThead)
* [jquery.tablesort](https://github.com/kylefox/jquery-tablesort)
* [jquery](https://jquery.com/)
* [electron](https://electronjs.org/)