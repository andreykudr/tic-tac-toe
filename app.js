const express = require('express')
    , app = express()

app.listen(3000)

app.use(express.static(__dirname + '/static'))

module.exports = app