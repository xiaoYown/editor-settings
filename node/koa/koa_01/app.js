
'use strict'

const path 			= require('path');
const Koa 			= require('koa');
const app 			= new Koa();
const render 		= require('koa-ejs');
const co 			= require('co');
const convert 		= require('koa-convert');
const json 			= require('koa-json');
const onerror 		= require('koa-onerror');
const bodyparser 	= require('koa-bodyparser')();
const logger 		= require('koa-logger');
const redisStore 	= require('koa-redis');

const Router = require('koa-router');

const router = Router();

var wrapper = require('co-mysql'),
	mysql 	= require('mysql'); 

var options = {
    host : 'localhost',
    port : 3306 ,
    database : 'test',
    user: 'root',
    password : '511687372'
};

var pool = mysql.createPool(options),
	p = wrapper(pool);

app.use(convert(require('koa-static2')("/static", __dirname + '/static')));
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));
onerror(app);

 render(app, {
	root: path.join(__dirname, 'views'),
	layout: 'layout',
	viewExt: 'html',
	cache: false,
	debug: true
});

var myRouter = new Router();

router
	.get('/', function *( next ) {
		var rows = yield p.query('SELECT * FROM AUTHORS WHERE email=511687372 LIMIT 1');

		console.log(rows)

		yield this.render('index', {layout: false, title: '首页'});
	})
	.post('/register', function *( next ) {
		console.log(this.req)
	}, router.allowedMethods());


app.use(router.routes());

// router.use('/', index.routes(), index.allowedMethods());

// response
app.on('error', function(err, ctx){
	console.error(err);
	// console.error('server error', err, ctx);
});

app.listen(3002);

module.exports = app;