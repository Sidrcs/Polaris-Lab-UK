(function(){

    //pseudo-global variable    
    var attrArray = ["admin1_code", "std_dev_age",	"native_share", "education_variability","region_name", "job_variability","frac_employed","median_income"," gini_index", "Lindqvist_Ostling_S1", "Abramowitz_Saunders_S1","Duca_Saving_S1", "Lindqvist_Ostling_S2", "Abramowitz_Saunders_S2", "Duca_Saving_S2","Lindqvist_Ostling_S3","Abramowitz_Saunders_S3","Duca_Saving_S3"];
    
    var arrayDict = {"admin1_code": "admin1_code", "std_dev_age": "Standard Deviation of Age",	"native_share": "Native Share", "education_variability": "Education Variability","region_name": "Region Name", "job_variability": "Job Variability","frac_employed":"Fraction Employed","median_income": "Median Income"," gini_index": "Gini Index", "Lindqvist_Ostling_S1": "Lindqvist Ostling A", "Abramowitz_Saunders_S1": "Abramowitz Saunders A","Duca_Saving_S1": "Duca Saving A", "Lindqvist_Ostling_S2": "Lindqvist Ostling B", "Abramowitz_Saunders_S2": "Abramowitz Saunders B", "Duca_Saving_S2": "Duca Saving B","Lindqvist_Ostling_S3": "Lindqvist Ostling C","Abramowitz_Saunders_S3": "Abramowitz Saunders C","Duca_Saving_S3": "Duca Saving C"};
    
    var arrayObj = [{data:"admin1_code", text:"admin1_code"}, {data:"std_dev_age", text:"Standard persons (Total)"}, {data:"hhkids1620_est", text:"Percent Household with children"}, {data:"kids1620_est", text:"Percent Children"}, {data:"seniors1620_est", text:"Percent Seniors"}, {data:"edlesshs1620_est", text:"Education less than high school (%)"}, {data:"langeng1620_est", text:"English spoken at home (%)"}, {data:"langasn1620_est", text:"Asian language spoken at home (%)"}, {data:"racewhite1620_est", text:"Percent White"}, {data:"raceaa1620_est", text:"Percent African American"}, {data:"raceasian1620_est", text:"Percent Asian"}, {data:"raceamind1620_est", text:"Percent Native Americans"}, {data:"hispanic1620_est", text:"Percent Hispanic"}, {data:"noncitizens1620_est", text:"Percent Non-citizens"}, {data:"drive1620_est", text:"Workers driving or carpooling to work"}, {data:"prateacs1620_est", text:"Poverty (all persons %)"}, {data:"pratekidsacs1620_est", text:"Poverty (kids %)"}, {data:"gini1620_est", text:"Gini index of income inequality"}, {data:"renters1620_est", text:"Households renting home"}, {data:"noveh1620_est", text:"Households without vehicle (%)"}];
    
    var expressed = attrArray[1]; // loaded attribute based on index
    
    // create chart dimensions
    var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
    // create a scale to size lines proportionally to frame and for axis
    var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 50]);
    
    window.onload = setMap();
    
    // setup a choropleth map
    function setMap(){
        // map frame dimensions
        var width = window.innerWidth * 0.475;
            height = 473;
    
        // create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);
    
        // create Albers equal area conic projection centered on UK
        var projection = d3.geoAlbers()
            .center([0.00, 49])
            .rotate([5, -6.5, 0])
            .parallels([29.5, 46.5])
            .scale(2000)
            .translate([width / 2, height / 2]);
    
        // geopath() method helps in drawing the geometries
        var path = d3.geoPath()
            .projection(projection); // path holds projection and helps in rendering the projection
    
        // promises container is created to hold the promise
        var promises = [];
    
        // d3.csv(), d3.json() methods read csv, topojson files
        promises.push(d3.csv("data/polarization1995_data.csv"));
        promises.push(d3.json("data/UK_regions.topojson"));
    
        // Promise helps to load the data asynchronously
        // bind the output into callback function
        Promise.all(promises).then(callback);
    
        // callback reads the output response of promises (read files - csv, topojson)
        // retrieves the file information
        function callback(data){
            var csvData = data[0], uk = data[1];
    
            // place graticule on the map. But it is not used in map
            //setGraticule(map,path);
    
            // testing whether the files are loaded correctly or not
            console.log("CSV data below",csvData);
            console.log("TopoJSON data below",uk);
    
            // translate uk Regions from topojson to geojson
            var ukRegions = topojson.feature(uk, uk.objects.UK_regions).features;
    
            // join data of uk Regions
            ukRegions = joinData(ukRegions,csvData);
    
            // create a colorscale
            var colorScale = makeColorScale(csvData);
    
            // add enumeration units to the map
            setEnumerationUnits(ukRegions, map, path, colorScale)
    
            // add dropdown to the map
            createDropdown(csvData);
    
            // add dotplot visualization to the map
            setDotPlot(csvData, colorScale);
    
            // add color legend
            makeColorLegend(colorScale);
           
        };
    };
    
    // Drawing county data to map frame
    function setEnumerationUnits(ukRegions, map, path, colorScale){
        // add uk to map
       var Regions = map.selectAll(".Regions")
         .data(ukRegions)
         .enter()
         .append("path")
         .attr("class", function(d){
             // console.log("Regions",d.properties.admin1_code)
             return "Regions " + d.properties.admin1_code;
         })
         .attr("d", path)
         .style("fill", function(d){            
           var value = d.properties[expressed];            
           if(value) {                
               return colorScale(d.properties[expressed]);            
           } else {                
               return "#ccc";            
           }    
       })
       // mouseover, mouseout events for highlighting or dehighlighting
       .on("mouseover", function(event, d){
           highlight(d.properties);
       })
       .on("mouseout", function(event, d){
           dehighlight(d.properties);
       })
       // label event listener
       .on("mousemove", moveLabel);
    
       // county dehighlight solution
       var desc = Regions.append("desc")
           .text('{"stroke": "#464545", "stroke-width": "0.5px"}');
    };
    
    // setGraticule generates graticule for map
    function setGraticule(map,path){
            // create graticule generator
            var graticule = d3.geoGraticule()
                .step([2, 2]); //place graticule lines every 1 degree of longitude and latitude
            
            // create graticule background
            var gratBackground = map.append("path") 
                .datum(graticule.outline()) // bind graticule background
                .attr("class", "gratBackground") // assign class for styling
                .attr("d", path) // project graticule
    
            // create graticule lines
            var gratLines = map.selectAll(".gratLines")  // select graticule elements that will be created
                .data(graticule.lines()) // bind graticule lines to each element to be created
                .enter() // create an element for each datum
                .append("path") // append each element to the svg as a path element
                .attr("class", "gratLines") // assign class for styling
                .attr("d", path); // project graticule lines
    };
    
    // joinData() combines TopoJSON & CSV data based on primary key
    function joinData(ukRegions, csvData){
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.admin1_code; //the CSV primary key
    
            //loop through geojson Regions to find correct region
            for (var a=0; a<ukRegions.length; a++){
    
            var geojsonProps = ukRegions[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.admin1_code; //the geojson primary key
    
            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey === csvKey){
    
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
                geojsonProps.admin1_code = csvRegion.admin1_code;
            };
            };
        };
        console.log("GeoJSON info below", ukRegions)
        return ukRegions
        
    };
    
    //function to create color scale generator
    function makeColorScale(data){
        // sequential color schemes are adopted from ColorBrewer (Green Below)
        var colorClasses = ["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"];
        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);
        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };
        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);
        return colorScale;
    };
    
    // Redesigned code from Stackoverflow (via Annika Anderson)
    function makeColorLegend(color) {
        var width = 300,
            height = 300;
            topBottomPadding = 5;
    
        var left = document.querySelector(".map").getBoundingClientRect().left,
            bottom  = document.querySelector(".map").getBoundingClientRect().bottom;
    
        var svg = d3.select("body")
            .append("svg")
            .attr("class", "legend")
            .attr("width", width)
            .attr("height", height)
            .style("left", left - 90)
            .style("top", bottom - 120);
    
        var legend = svg.selectAll("g.legendEntry")
            .data(color.range().reverse())
            .enter()
            .append("g").attr("class", "legendEntry")
            .style("float", "left");
            
        legend.append("rect")
            .style("float", 'left')
            .attr("x", width - 200)
            .attr("y", function (d, i) {
                return i * 20;
            })
            .attr("width", 26)
            .attr("height", 22)
            .style("stroke", "#bdbdbd")
            .style("stroke-width", 0.5)
            .style("fill", function (d) { return d; });
    
        //the data objects are the fill colors
        legend.append("text")
            .attr("x", width - 170) //leave 5 pixel space after the <rect>
            .attr("y", function (d, i) {
                return i * 22.5;
            })
            .attr("dy", "0.8em") //place text one line *below* the x,y point
            .text(function (d, i) {
                var extent = color.invertExtent(d);
                //extent will be a two-element array
                var format = d3.format("0.2f");
                return format(+extent[0]) + " - " + format(+extent[1]);
            }) 
            .style("color", "#464545");
    };
    
    //function to create coordinated bar chart
    function setChart(csvData, colorScale){
        //chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 473,
            leftPadding = 25,
            rightPadding = 2,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
    
        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
    
        //create a scale to size bars proportionally to frame and for axis
        var yScale = d3.scaleLinear()
            .range([463, 0])
            .domain([0, 50]);
    
        //set bars for each province
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return parseFloat(b[expressed])-parseFloat(a[expressed])
            })
            .attr("class", function(d){
                return "bar " + d.NAMELSAD;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth / csvData.length) + leftPadding;
            })
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return colorScale(d[expressed]);
            });
    
        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text(arrayDict[expressed]);
    
        //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);
    
        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
    
        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
    
        var desc = Regions.append("desc")
            .text('{"stroke": "#464545", "stroke-width": "1px"}');
    };
    
    // function to create coordinated lollipop chart from https://d3-graph-gallery.com/graph/lollipop_basic.html
    function setDotPlot(csvData, colorScale){
        // create chart dimensions
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 473,
            leftPadding = 20,
            rightPadding = 0.5,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
        // create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
    
         // create a rectangle for chart background fill
         var chartBackground = chart.append("rect")
         .attr("class", "chartBackground")
         .attr("width", chartInnerWidth)
         .attr("height", chartInnerHeight)
         .attr("transform", translate);
    
        // create a scale to size lines proportionally to frame and for axis
        var yScale = d3.scaleLinear()
            .range([463, 0])
            .domain([0, 50]);
    
        // set lines for each county
        var lines = chart.selectAll(".line")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return parseFloat(b[expressed])-parseFloat(a[expressed])
            })
            .attr("class", function(d){
                // console.log("line", d.admin1_code)
                return "line " + d.admin1_code;
            })
            .attr("width", "0.5")
            .attr("x", function(d, i){
                return i * (chartInnerWidth / csvData.length) + (leftPadding+2.75)
            })
            .attr("y", function(d, i){
                console.log("Dot plot value",expressed)
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .on("mouseover", function(event, d){
                highlight(d);
            })
            .on("mouseout", function(event, d){
                dehighlight(d);
            })
            .on("mousemove", moveLabel);
    
         // circles
         var circles = chart.selectAll(".circle")
            .data(csvData)
            .join("circle")
            .sort(function(a, b){
                return parseFloat(b[expressed])-parseFloat(a[expressed])
            })
            .attr("class", function(d){
                // console.log("line", d.admin1_code)
                return "circle " + d.admin1_code;
            })
            .attr("cx", function(d, i) {
                return i * (chartInnerWidth / csvData.length) + ((chartInnerWidth / csvData.length) / 2);
                
            })
            .attr("cy", function(d){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .attr("r", "4")
            .style("fill", function(d){
                return colorScale(d[expressed])
            })
            .attr("stroke", "#636363")
            .on("mouseover", function(event, d){
                highlight(d);
            })
            .on("mouseout", function(event, d){
                dehighlight(d);
            })
            .on("mousemove", moveLabel);
    
        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 30)
            .attr("class", "chartTitle")
            .text(arrayDict[expressed]);
    
        //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);
    
        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
    
        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
    
        // set line & circle positions, heights, and colors
        updateChart(lines, circles, csvData.length, colorScale);
    
        var desc = lines.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');
    
        var desc2 = circles.append("desc")
         .text('{"stroke": "#636363", "stroke-width": "1px"}');
    
    }; 
    
    // creates dropdown based on arrayObj array
    function createDropdown(csvData){
    
        var left = document.querySelector('.map').getBoundingClientRect().left + 8,
            top = document.querySelector('.map').getBoundingClientRect().top + 6;
            bottom = document.querySelector('.map').getBoundingClientRect().bottom;
    
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .style("left", left + "px")
            .style("top", top + "px")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });
    
        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");
    
        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(arrayObj)
            .enter()
            .append("option")
            .attr("value", function(d){ return d.data })
            .text(function(d){ return d.text });
    };
    
    //dropdown change event handler
    function changeAttribute(attribute, csvData) {
    
        // change the expressed attribute
        expressed = attribute;
    
        // recreate color scale
        var colorScale = makeColorScale(csvData);
    
        // recolor Regions
        var Regions = d3.selectAll(".Regions")
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                var value = d.properties[expressed];
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            });
    
        // set lines for each county
        var lines = d3.selectAll(".line")
            .sort(function(a, b){
                return parseFloat(b[expressed])-parseFloat(a[expressed])
            })
            .transition() //add animation
            .delay(function(d, i){
                return i * 10
            })
            .duration(500);
    
        // circles
        var circles = d3.selectAll("circle")
            .sort(function(a, b){
                return parseFloat(b[expressed])-parseFloat(a[expressed])
            })
    
        var domainArray = [];
        for (var i=0; i<csvData.length; i++){
            var val = parseFloat(csvData[i][expressed]);
            domainArray.push(val);
        };
        var max = d3.max(domainArray);
    
        yScale = d3.scaleLinear()
            .range([463, 0])
            .domain([0, max+(0.1*max)]);
    
        var yAxis = d3.axisLeft()
            .scale(yScale);
    
        d3.select(".axis").call(yAxis)
    
        d3.select(".legend").remove();
        makeColorLegend(colorScale);
    
        // set line & circle positions, heights, and colors
        updateChart(lines, circles, csvData.length, colorScale);
    }; 
    
    //function to position, size, and color lines in chart
    function updateChart(lines, circles, n, colorScale){
        
        //position lines
        lines.attr("x", function(d, i){
                return i * (chartInnerWidth / n) + (leftPadding + 2.75)
            })
            // resize lines
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
    
        // position circles
        circles.attr("cx", function(d, i) {
                return i * (chartInnerWidth / n) + leftPadding + ((chartInnerWidth / n) / 2);
            })
            .attr("cy", function(d){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .attr("r", "4")
            // recolor circles
            .style("fill", function(d){            
                var value = d[expressed];            
                if(value) {                
                    return colorScale(value);            
                } else {                
                    return "#ccc";            
                }  
            })
            .attr("stroke", "#636363");
    
        var chartLabel = arrayDict[expressed] + " in each county";
    
        var chartTitle = d3.select(".chartTitle")
            .text(chartLabel);
    }; 
    
    //function to highlight enumeration units and bars
    function highlight(props){
        //change stroke
        var selected = d3.selectAll("." + props.admin1_code)
            .style("stroke", "#252525")
            .style("stroke-width", "3");
            
        setLabel(props);
    };
    //function to reset the element style on mouseout
    function dehighlight(props){
        var selected = d3.selectAll("." + props.admin1_code)
            .style("stroke", function(){
                return getStyle(this, "stroke")
            })
            .style("stroke-width", function(){
                return getStyle(this, "stroke-width")
            });
    
        function getStyle(element, styleName){
            var styleText = d3.select(element)
                .select("desc")
                .text();
    
            var styleObject = JSON.parse(styleText);
            return styleObject[styleName];
        };
    
        //remove info label
        d3.select(".infolabel").remove();
    };
    
    function setLabel(props){
        //label content
        var labelAttribute = "<b style='font-size:25px;'>" + props[expressed] + 
        "</b> <b>" + attrArray[expressed] + "</b>";
    
        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.admin1_code + "_label")
            .html(labelAttribute);
    
        var countyName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.NAMELSAD);
    };
    
    // function to move info label with mouse
    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;
    
        // use coordinates of mousemove event to set label coordinates
        var x1 = event.clientX + 10,
            y1 = event.clientY - 75,
            x2 = event.clientX - labelWidth - 10,
            y2 = event.clientY + 25;
    
        // horizontal label coordinate, testing for overflow
        var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        // vertical label coordinate, testing for overflow
        var y = event.clientY < 75 ? y2 : y1; 
    
        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };
    
    
    })();