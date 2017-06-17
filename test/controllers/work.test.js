var app = require('../../app');
var request = require('supertest')(app);
var work = require('../../controllers/work');


describe('test/controllers/work.test.js', function () {

    it('should 200 when post /api/getWorkReportData', function (done) {
        request.post('/api/getWorkReportData')
            .expect(200, function (err, res) {
                if (err) {
                    return done(err);
                }
                done();
            });
    })
});