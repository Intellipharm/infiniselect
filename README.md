# InfiniSelect

## An infinite scroll searchable select box

## Install

Include cluster and infiniselect files
```html
<script src="clusterize/clusterize.min.js"></script>
<link rel="stylesheet" href="clusterize/clusterize.css" />

<link rel="stylesheet" href="infiniselect.css" />
<script src="infiniselect.js"></script>
```

## Usage

```js
var infiniselect = InfiniSelect(document.getElementById('infiniselect'), options);
```

## Options

```js
{
    /*
     * loadNextPage()
     *
     * @param rowCount - The current number of rows showing in the dropdown
     * @param callback - Function to execute with data
     */
    loadNextPage: function(rowCount, callback) {
        // hit an api and execute the callback
        callback({
            data: [
                {content: 'qwerty', selected: true},
                {content: 'asdf'},
                {content: 'zxcv'},
            ]
        });
    },
    // The amount of time to wait for the user to finish typing before commencing a search
    searchTimer: 500,
    /*
     * search
     *
     * @param search - The string being searched for
     * @param rowCount - The current number of rows showing in the dropdown
     * @param callback - Function to execute with data
     */
    search: function(search, rowCount, callback) {
        // hit an api and execute the callback
        callback({
            data: [
                {content: 'qwerty', selected: true},
                {content: 'asdf'},
                {content: 'zxcv'},
            ]
        });
    },
}
```