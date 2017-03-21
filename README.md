
# various-scripts-for-analyzing-webpack-stats

These are the various scripts that I use for analyzing webpack stats file.


## Assumptions

The `data` directory should contain these files:

- `webpack.stats.json` the stats file generated from `webpack --json --profile`
- `assets/` the built files should be put in this directory. You can use `downloadChunks` script to download just the JS files.
