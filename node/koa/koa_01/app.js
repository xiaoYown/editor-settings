
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
	db_operate = wrapper(pool);

app.use(convert(require('koa-static2')("/static", __dirname + '/static')));
app.use(convert(bodyparser));
app.use(convert(json()));
// app.use(convert(logger()));
onerror(app);

 render(app, {
	root: path.join(__dirname, 'views'),
	layout: 'layout',
	viewExt: 'html',
	cache: false,
	debug: true
});

var myRouter = new Router();
/**
 * 创建表: CREATE TABLE IF NOT EXISTS user_info ( user_id VARCHAR(30), user_pwd VARCHAR(30) )
 * 
 * 查询:   select * from table_name where __key__=__value__ (limit 1)
 * 
 * 插入列(首部): alter table table_name add  column col_name varchar(30) first
 * 插入列(末尾): alter table table_name add  column col_name varchar(30) (not null)
 * 插入列(之后): alter table table_name add  column col_name varchar(30) after __col__name
 * 删除列: alter table table_name drop column col_name
 * 
 * 插入行: inert into table_name (col1_name,col2_name) values (col1_val, col2_val)
 * 修改:   update table_name set _key_=_value_ where __key__=__value__ (limit 1) 
 */
router
	.get('/', function *( next ) {
		// var rows = yield db_operate.query('SELECT * FROM AUTHORS WHERE email=511687372 LIMIT 1');

		// console.log(rows)

		yield this.render('index', {layout: false, title: '首页'});
	})
	.post('/register', function *( cxt, next ) {
		let body = this.request.body;
		if( !!body.user_id && body.user_pwd ){
			console.log(`SELECT * FROM user_info WHERE EXISTS user_id="${body.user_id}"`)
			// let exists = yield db_operate.query(`SELECT * FROM user_info WHERE EXISTS user_id="${body.user_id}"`)
			// console.log(exists)
			// yield db_operate.query(`INSERT INTO user_info (user_id, user_pwd) VALUES ("${body.user_id}","${body.user_pwd}")`);

			this.body = {
				code: '000000',
				success: true,
				message: '注册成功',
			};
		}
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