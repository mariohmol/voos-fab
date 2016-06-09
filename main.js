var express = require('express');
var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var PDFParser = require("pdf2json/PDFParser");
var pdfUtil = require('pdf-to-text');
var pdf2table = require('pdf2table');
var csvWriter = require('csv-write-stream');




var app     = express();
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static('public'));
app.use('/public', express.static('public'));


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

      writePDF(files,0);

      res.send("foii");
    }
   })
});
var writePDF = function(files,index){
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
	    	writePDF(files,index+1);
	    })
	});
}





app.get('/readfiles', function(req, res){

	var lista = getFiles("./data/pdf");

	readPDF(lista,0);

	res.send(lista);
});
var resultadofinal;
var getFiles = function (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}
/*

Depois do arquivo  raw.cs salvo, adicionar na primeira linha
Orgao,Origem,Saida,Destino,Chegada,Tipo,id


E depois replace all de:

 ,Interino

 Por 
  Interino


  ,em Exercício
  Por 
  em Exercício

*/

var readPDF = function(files,index){

	if(resultadofinal ==null) resultadofinal = [];
	else if(index==files.length ) {
		fs.writeFile("./raw.txt", resultadofinal);

		var headers = ["AUTORIDADES APOIADAS","ORIGEM","DECOLAGEM","DESTINO","POUSO","MOTIVO","PREVISÃO DE","(H. LOCAL)","DESTINO"
		,"POUSO","(H. LOCAL)","MOTIVO","PREVISÃO DE","PASSAGEIROS"];
		var writer = csvWriter({ headers: headers,separator: ','});
		writer.pipe(fs.createWriteStream("./public/raw.csv"))
		resultadofinal.forEach(function(valpdf,index){
			valpdf.forEach(function(val,indexval){

				

				if(val.length>5 && val[0].trim()!= "AUTORIDADES APOIADAS" && val[1].trim()!= "AUTORIDADES APOIADAS" ) {
					for(i=0;i<val.length;i++){
						val[i]=val[i].replace(",","");
					};
					writer.write(val);
				}
				console.log(val,val.length);
			});
				
				//writer.write(resultadofinal)
		})
		
		writer.end()

		
		//console.log(resultadofinal);
		return;
	}

	nome = files[index].split("/");
	nome = nome[nome.length-1];

	console.log("Reading "+nome);

	//tipo="pdf2json";
	//tipo="pdf-to-text";
	tipo="pdf2table";

	if(tipo=="pdf2json"){
		var pdfParser = new PDFParser();
		pdfParser.on("pdfParser_dataError", errData => {
			console.error(errData.parserError) 
			readPDF(files,index+1);
		});
	  pdfParser.on("pdfParser_dataReady", pdfData => {
	  		console.log(pdfParser.getRawTextContent())
	      fs.writeFile("./data/json/"+nome+".json", JSON.stringify(pdfData));
	      fs.writeFile("./data/pdf/raw/"+nome+".txt", pdfParser.getRawTextContent());
	      readPDF(files,index+1);
	  });
	  pdfParser.loadPDF(files[index]);

	}else if(tipo=="pdf-to-text"){

		//pdfUtil.info(files[index], function(err, info) {
		var option = {from: 0, to: 10};
		pdfUtil.pdfToText(files[index], option, function(err, data) {
		    if (err) console.log(err);
		    else{
		    	console.log(info);
		    	fs.writeFile("./data/text/"+nome+".txt", info);
		    }
		    
		    readPDF(files,index+1);
		    
		});

	}else if(tipo=="pdf2table"){
		fs.readFile(files[index], function (err, buffer) {
    	if (err) return console.log(err);

		    pdf2table.parse(buffer, function (err, rows, rowsdebug) {
		        if(err)  {
		        	//console.log(err);
		        }else {
		        	resultadofinal.push(rows);
		        }
		      readPDF(files,index+1);
		    });
		});
	}

	
  

}


app.get('/', function(req, res){

	res.render('index.ejs', { title: 'ejs' });

	//res.send("Bem vindo");

});


app.listen('8081')

exports = module.exports = app;