var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;


var daten, 
    currRequest, 
    indexed,
    color;

function init(){
    chart = d3.select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    animations =  
    [  
        [
            function(){
                console.log("start animation 1");
                chart.selectAll("rect")
                    .transition()
                    .duration(1000) 
                    .attr("y", function( d ) { return  y(d.value); })
                    .attr("height", function ( d ){ return height - y(d.value); }) 
                    .style("fill",function( d, i ){ return colors(d.name); });
            },
            function(callback){
                console.log("finish animation 1");
                chart.selectAll("rect")
                    .transition()
                    .duration(1000) 
                    .attr("width", 0)
                    .style("fill","grey")
                    .call(endAll, callback);
            }
        ],
        [
            function(){
                console.log("start animation 2");
                chart.selectAll("rect")
                .transition()
                .duration(500) 
                .delay(function(d,i) { return i * 100; })
                .ease("elastic")
                .attr("y", function( d ) { return  y(d.value); })
                .attr("height", function ( d ){ return height - y(d.value); })
                .each("end", function(d,i){
                    d3.select(this) 
                        .transition()
                        .duration(1000)
                        .style("fill", function(){ return colors(d.name); }); 
                });

            },
            function(callback){
                console.log("finish animation 1");
                chart.selectAll("rect")
                .transition()
                .duration(250) 
                .delay(function(d,i) { return i * 100 })
                .ease("linear")
                .attr("x", width + margin.right)
                .style("opacity","0.0")
                .call(endAll, callback)
            }   
        ],
        [
            function(lastRequest){
                console.log("start animation 3");
                chart.selectAll(".set" + lastRequest)
                .transition()
                .duration(500) 
                .delay(function(d,i) { return i * 100; }) 
                .ease("linear")
                .attr("y", function( d ) { return  y(d.value); })
                .attr("width", x.rangeBand())
                .attr("height", function ( d ){ return height - y(d.value); })
                .attr("x", function(d) { return x(d.name); })
                .call(endAll, function(){
                    var tmpSet = daten.slice(); 
                    tmpSet.splice(lastRequest, 1); 

                    var tmpIndexed = indexed.slice(); 
                    tmpIndexed.splice(lastRequest, 1);

                    var u;
                    for(u = 0; u < tmpIndexed.length; u++){  
                        chart.selectAll(".set" + tmpIndexed[u])
                            .data(tmpSet[u])
                            .enter()        
                            .append("rect")
                            .attr("class", "set" + tmpIndexed[u])
                            .attr("width", x.rangeBand())
                            .attr("height", function ( d ){ return height - y(d.value); })
                            .attr("x", function(d) { return x(d.name); })
                            .attr("y", function( d ) { return  y(d.value); })
                            .style("fill",function( d, i ){ return colors(d.name); })
                            .style("opacity","0")
                            .transition()
                            .duration(1000)
                            .style("opacity","1");
                    }
                });
            },
            function(request){
                console.log("finish animation 3");
                chart.selectAll("rect:not(.set" + request + ")")
                        .transition()
                        .duration(1500)
                        .attr("width",0)
                        .attr("height", 0)
                        .attr("y", height)
                        .call(endAll, function(){
                            chart.selectAll("rect:not(.set" + request + ")")
                            .remove();
                        });

                
                chart.selectAll(".set" + request)
                        .transition()
                        .duration(1500)
                        .attr("width", x.rangeBand())
                        .attr("height", function ( d ){ return height - y(d.value); })
                        .attr("x", function(d) { return x(d.name); })
                        .attr("y", function( d ) { return  y(d.value); })
                        .style("opacity","1");
            }   
        ]
    ]; 
    
    //get data from json file
    d3.json("data.json", function(error, data) {
            if(error) console.warn(error);
            else{
                daten = data;
                allData = data.slice();
                
                var combinedData = [];
                daten.forEach( function(d){ combinedData = combinedData.concat(d); });
                allData.push(combinedData);

                indexed = d3.range(0,daten.length);
                
                colors = d3.scale.category20().domain( combinedData.map(function(d){ return d.name; }));  
                
                d3.select("body")
                    .append("div")
                    .append("select")
                    .selectAll("option")
                    .data(allData)
                    .enter()
                    .append("option")
                    .attr("value", function( d,i ) { return i; })
                    .text(function(d,i){return d[0].name  + " - " + d.last().name; });
                
           
                d3.select("select").on("change", stateEngine);
                
                constructChart(data[ d3.select("select").property('selectedIndex') ]);
                stateEngine(); 
            }            
    });
}

// constructing initial chart and by that, defining x,y,yAxis and xAxis
function constructChart(data) {
    y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.value; })])
        .range([height, 0]);
   
    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    x = d3.scale.ordinal()
        .domain(data.map(function(d) { return d.name; }))
        .rangeRoundBands([0, width], 0.1);
        
    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    
    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis); 
}

// transitioning the x and y axis
function rescale(request) { 
    x.domain(allData[request].map(function(d) { return d.name; }));
    chart.select(".x")
            .transition()
            .duration(1000)
            .ease("sin-in-out") //https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
            .call(xAxis);
    
    y.domain([0, d3.max(allData[request], function(d) { return d.value; })]);
    chart.select(".y")
            .transition()
            .duration(1500)
            .ease("sin-in-out")  
            .call(yAxis); 
}


//scales amount of bars according to data / initializes bars
function resetBar(request){
    var bars = chart.selectAll("rect").data(daten[request]);
    
    bars.enter().append("rect").call(construct,request);//enter
    bars.call(construct,request);//update
    bars.exit().remove();//exit
    
    function construct(selection,request){
        selection.attr("class", "set" + request)
                .attr("width", x.rangeBand())
                .attr("height", 0)
                .attr("x", function(d) { return x(d.name); })
                .attr("y", height)
                .style("fill","grey")
                .style("opacity","1");
    }
}


//convenience function for starting a new animation
function intro(animation, request){
    return function(){
        resetBar(request);
        animation[0]();
        currRequest = request;
    };  
}


// keeps track of last animation
function stateEngine(){
   var request = d3.select("select").property('selectedIndex');  // get selected index
        rescale(request);

        if(request === daten.length){ // play overview animation
            animations.last()[0](currRequest);
            currRequest = daten.length;
        }
        else if(currRequest === daten.length){ // exit overview animation
            animations.last()[1](request);
            currRequest = request;
        }
        else{
            if(currRequest === undefined){ // no predecessor (first request)                
                intro(animations[request], request)();
            }
            else 
            {
                var req = request % (animations.length-1);
                var curr = currRequest % (animations.length-1);
                animations[curr][1](intro(animations[req], request),request);
            }
        }
}

// called by exit animation to nudge intro animation of next data set
function endAll(transition, callback){
    var n = 0; 
    transition 
        .each(function() { ++n; }) 
        .each("end", function() { if (!--n) callback(); }); 
}

//helper to get last array element
Array.prototype.last = function() {
    return this[this.length-1];
}


  



