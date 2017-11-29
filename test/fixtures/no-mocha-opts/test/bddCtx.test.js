var http    = require('http');
var request = require('../../../../');
var Should  = require('should');

describe('no mocha.opts', function() {
    var svr;
    before(function(done) {
        svr = http.createServer(function(q,r) { r.end('ok') } ).listen(4321, done);
    });
    after(function(done) {
        svr.close(done)
    });
  
    describe('standard', function(){
        
        var ctx = request('http://localhost:4321')
        .responds( { status: 200 })
        
        describe('returned ctx', function() { 
            it('should have err', function() {
                ctx.should.have.property('err');
            });
            it('should have res', function() {
                Should(ctx.res).be.an.Object;
            });
            it('should have body', function() {
                Should(ctx.body).eql('ok');
            })
        })
    })

    describe('skipped', function(){
        var ctx = request.skip('http://localhost:4321')
        .responds({status: 200});
        
        describe('returned ctx', function() { 
            it('should return ctx', function() {
                ctx.should.be.an.Object()
            });
            it('should not have err', function() {
                ctx.should.not.have.property('err');
            });
            it('should not have res', function() {
                ctx.should.not.have.property('res');
            });
            it('should not have body', function() {
                ctx.should.not.have.property('body');
            })
        })
    })     
})