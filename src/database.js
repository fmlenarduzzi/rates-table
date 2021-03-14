const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost/ratesTable', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
    .then(() => console.log('Database is connected.'))
    .catch(err => console.log(err));
