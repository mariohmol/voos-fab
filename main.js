var express = require('express');
var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();


var datapage = "./data/page.html";

app.get('/getpage', function(req, res){
   
  var url="http://www.fab.mil.br/voos/index"
	request(url, function(error, response, html){
    if(!error){
			fs.writeFile(datapage, html, function(err) {
			    if(err) {
			    	res.send(err);
			    }
			    res.send("The file was saved!");
			}); 
    }
	});
});



app.get('/getfiles', function(req, res){
   
	fs.readFile(datapage, 'utf8', function (err,data) {
    if (err) {
    		res.send(err);
    } else {
    	

    	var $ = cheerio.load(data);

      var dias = $('.datadia a');

      var files = [];
      dias.each(function(i,val){
      	url = $(val).attr("href");
      	files.push(url);
      });

      readPDF(files,0);

      res.send("foii");
      //res.send(result);
        
    }
   })
});

var readPDF = function(files,index){
	if(index==files.length) return;
	var url=files[index];
	var name = url.split("/");
	namefile = "./data/pdf/" + name[name.length-1];

	console.log(url,namefile, index);
	
	file = fs.createWriteStream(namefile)
	var request = http.get(url, function(response) {
	    response.on('data', function(data){
	        file.write(data)
	    }).on('end', function(){
	        /*files[namefile].end(function() {
	            postData(fs.readFileSync(files[namefile]))
	        });*/
	    	readPDF(files,index+1);
	    })
	});
}





app.get('/readfiles', function(req, res){
   /*
	fs.open(datapage, 'w+', function(err, data) {
    if (err) {
    		res.send(err);
    } else {
    	res.send(data);

    	var $ = cheerio.load(html);

      var dias = $('.datadia');
      console.log(dias);
      var result = "";
      dias.forEach(function(i,val){
      	result += val.html()
      });
      //res.send(result);
        
    }
   })
    */
});



app.get('/', function(req, res){
	res.send("Bem vindo");

});


app.listen('8081')

exports = module.exports = app;