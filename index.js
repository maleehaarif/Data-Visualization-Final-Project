function filtering(data, year) {
  //for filtering data function
  let country = {},
    country_arr = [],
    count_obj = {},
    country_area = {};
  let total = 0;
  data.forEach((d) => {
    d[year] = parseFloat(d[year]);
  
      if (count_obj[d.Country] == undefined) {
        count_obj[d.Country] = {};
        country_area[d.Country] = [d.Area_km_sq];
      
    }
    count_obj[d.Country][d.Sector] = d[year]
  });
console.log(count_obj,"cpunt");
  Object.keys(count_obj).forEach((k) => {
    if (
      k.localeCompare("European Union") != 0 &&
      k.localeCompare("European Union (27)") != 0 &&
      k.localeCompare("World") != 0
    ) {
      Object.keys(count_obj[k]).forEach((d) => {
        total = total + count_obj[k][d];
      });
      country[k] =
        Math.round(
          (total / parseFloat(country_area[k] / 1000000) + Number.EPSILON) * 100
        ) / 100;
      country_arr.push({
        country: k,
        value:
          Math.round(
            (total / parseFloat(country_area[k] / 1000000) + Number.EPSILON) *
              100
          ) / 100,
      });
      total = 0;
    }
  });
  return { country: country, country_arr: country_arr, count_obj: count_obj };
}

function dashboard() {
  d3.csv("data.csv").then((data) => {
    //loading csv
    let result = filtering(data, "2018"); //for first time chart filtering data on the start year
    let years = [2012, 2013,2014, 2015, 2016, 2017, 2018,2019,2020];

    console.log(data,"hello")

    let years_result = [];
    years.forEach((d) => {
      let temp = filtering(data, d);
      years_result.push({ year: d, count: temp.country });
    });
    let country_line_obj = {},
      arr = [];

    Object.keys(years_result[0].count).forEach((b) => {
      years_result.forEach((d) => {
        arr.push({ year: d.year, value: d.count[b] });
      });
      country_line_obj[b] = arr;
      arr = [];
    });
    d3.select("#years").on("change", (d, i) => {
      //this will call when the year dropdown value changes
      let year = document.getElementById("years").value; //getting changed value
      result = filtering(data, year); //calling filter
      map(
        result.country,
        result.country_arr,
        result.count_obj,
        country_line_obj
      ); //calling drawing function

    });

    // result = filtering(data,2018) //TO-DO: change this manually based on default value option

    map(result.country, result.country_arr, result.count_obj, country_line_obj); //calling drawing function
    lineChart(country_line_obj["India"], "India");
  });
}

function map(data, data_arr, bar_obj, line_obj) {
  //drawing function
  console.log(data,"data");
  d3.select("#world_chart svg").remove(); //remove previous drawn chart for filteration
  d3.select("#world_legend svg").remove();
  d3.select("#world_chart div").remove(); //remove previous drawn tooltip for filteration
  let width = 401,
    height = 285;
console.log(data,"data");
  let svg = d3 //adding svg container
    .select("#world_chart")
    .append("svg")
    .attr("width", width + 121 + 121)
    .attr("height", height + 71 + 71)
    .attr("transform", `translate(201,0)`)
    .append("g")
    .attr("transform", `translate(140,0)`);

  let world_tooltip = d3
    .select("#world_chart")
    .append("div") //adding tooltip div
    .attr("id", "tooltip")
    .style("opacity", 0);
  // Map and projection
  let projection = d3
    .geoMercator()
    .scale(Math.min(width, height) / (width > height ? 3.11 : 7)) //for increasing map size
    .translate([width / 2, height / 1, 0.5]); //for map positioning x and y axis

  let max = d3.max(data_arr, function (d) {
    //finding max value in the data arr
    return d.value;
  });
  let min = d3.min(data_arr, function (d) {
    //finding min value in the data arr
    return d.value;
  });

  data_arr = data_arr.sort(function (a, b) {
    return a.value - b.value;
  });

  let parts = Math.floor(data_arr.length / 4);

  let ranges = [];

  let part1 = 0;
  let part2 = data_arr[parts * 1].value;
  let part3 = data_arr[parts * 2].value;
  let part4 = data_arr[parts * 3].value;
  let part5 = max;

  ranges.push(part1, part2, part3, part4, part5);

  var path = d3.geoPath().projection(projection);
  let centered;
  let colorTheme = d3 //making color scheme
    .scaleQuantile()
    
    .range(["grey", "purple", "red", "blue", "green"])
    .domain([0, 1, 2, 3, 4]);
  let worldMap;

  d3.json("globe.json").then((world) => {
    worldMap = svg //drawing world map
      .append("g")
      .selectAll("path")
      .data(world.features)
      .enter()
      .append("path")
      .attr("d", d3.geoPath().projection(projection))
      .attr("fill", function (d) {
        //filling color on the basis of values
        if (
          parseFloat(data[d.properties.name]) >= part1 &&
          parseFloat(data[d.properties.name]) < part2
        ) {
          return colorTheme(1);
        } else if (
          parseFloat(data[d.properties.name]) >= part2 &&
          parseFloat(data[d.properties.name]) < part3
        ) {
          return colorTheme(2);
        } else if (
          parseFloat(data[d.properties.name]) >= part3 &&
          parseFloat(data[d.properties.name]) < part4
        ) {
          return colorTheme(3);
        } else if (
          parseFloat(data[d.properties.name]) >= part4 &&
          parseFloat(data[d.properties.name]) <= part5
        ) {
          return colorTheme(4);
        } else {
          return colorTheme(0);
        }
      })
      .style("stroke", "transparent")
      .attr("class", function (d) {
        return "selected_country";
      })
      .style("opacity", 0.8);
    worldMap
      .on("mouseover", function (i, d) {
        //for tooltip effects
        d3.selectAll(".selected_country").style("opacity", 0.5);
        d3.select(this).style("opacity", 1).style("stroke", "black");
        d3.select(this).style("fill-opacity", 1);
        console.log(data[d.properties.name]);

        world_tooltip.transition().duration(300).style("opacity", 1);
        world_tooltip
          .html(
            `<span style="font-size:20px;font-weight:bold">Country: ${
              d.properties.name
            }<br></span><span style="font-size:20px;font-weight:bold">External Debt: ${
              data[d.properties.name] || 0
            }`
          )
          //data[d.properties.name] || 0
          .style("visibility", "visible") //adding values on tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 30 + "px");
      })
      .on("mouseleave", function (d) {
        // for hiding tooltip effects
        d3.selectAll(".selected_country").style("opacity", 0.8);

        d3.select(this).style("stroke", "transparent");

        world_tooltip
          .style("visibility", "none")
          .transition()
          .duration(301)
          .style("opacity", 0);
      })
      .on("click", clicked);
  });

  function clicked(i, d) {
    //zoom function and bar call function
    selected_country = d.properties.name;
    console.log(selected_country);
    let bar_arr = bar_obj[selected_country];
    // console.log(bar_obj);
    if (line_obj[d.properties.name] != undefined)
      lineChart(line_obj[d.properties.name], d.properties.name);
    if (bar_arr != undefined) bar(bar_arr, d.properties.name);
    var x, y, k;

    if (d && centered !== d) {
      //checking if clicked value valid and not already zoomed
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      //if already zoomed and have to zoom out
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    worldMap.selectAll("path").classed(
      "active",
      centered &&
        function (d) {
          return d === centered;
        }
    );

    worldMap //zooming unzooming with animation/transition
      .transition()
      .duration(750)
      .attr(
        "transform",
        "translate(" +
          width / 2 +
          "," +
          height / 2 +
          ")scale(" +
          k +
          ")translate(" +
          -x +
          "," +
          -y +
          ")"
      )
      .style("stroke-width", 1.5 / k + "px");
  }

  //g container for legends
  let g = //svg
    d3
      .select("#world_legend")
      .append("svg")
      .attr("class", "legendScheme")
      .attr("width", 370)
      .attr("height", 301)
      .append("g")
      .attr("width", 370)
      .attr("height", 301)
      .attr("transform", `translate(51,51)`);
  // /.attr("transform", "translate(-55,25)");
  g.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -6)
   
}

function createBubbleChart(error, countries, continentNames) {
  console.log(countries,"countriesss");
console.log(continentNames,"con names");
  var populations = countries.map(function(country) { return +country.Population; });
  var meanPopulation = d3.mean(populations),
      populationExtent = d3.extent(populations),
      populationScaleX,
      populationScaleY;

  var continents = d3.set(countries.map(function(country) { return country.ContinentCode; }));
  var continentColorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(continents.values());

  var width = 1200,
      height = 800;
  var svg,
      circles,
      circleSize = { min: 10, max: 80 };
  var circleRadiusScale = d3.scaleSqrt()
    .domain(populationExtent)
    .range([circleSize.min, circleSize.max]);

  var forces,
      forceSimulation;

  createSVG();
  toggleContinentKey(!flagFill());
  createCircles();
  createForces();
  createForceSimulation();
  addFlagDefinitions();
  addFillListener();
  addGroupingListeners();

  function createSVG() {
    svg = d3.select("#bubble-chart")
      .append("svg")
        .attr("width", width)
        .attr("height", height);
  }

  function toggleContinentKey(showContinentKey) {
    var keyElementWidth = 150,
        keyElementHeight = 30;
    var onScreenYOffset = keyElementHeight*1.5,
        offScreenYOffset = 100;

    if (d3.select(".continent-key").empty()) {
      createContinentKey();
    }
    var continentKey = d3.select(".continent-key");

    if (showContinentKey) {
      translateContinentKey("translate(0," + (height - onScreenYOffset) + ")");
    } else {
      translateContinentKey("translate(0," + (height + offScreenYOffset) + ")");
    }

    function createContinentKey() {
      var keyWidth = keyElementWidth * continents.values().length;
      var continentKeyScale = d3.scaleBand()
        .domain(continents.values())
        .range([(width - keyWidth) / 2, (width + keyWidth) / 2]);

      svg.append("g")
        .attr("class", "continent-key")
        .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
        .selectAll("g")
        .data(continents.values())
        .enter()
          .append("g")
            .attr("class", "continent-key-element");

      d3.selectAll("g.continent-key-element")
        .append("rect")
          .attr("width", keyElementWidth)
          .attr("height", keyElementHeight)
          .attr("x", function(d) { return continentKeyScale(d); })
          .attr("fill", function(d) { return continentColorScale(d); });

      d3.selectAll("g.continent-key-element")
        .append("text")
          .attr("text-anchor", "middle")
          .attr("x", function(d) { return continentKeyScale(d) + keyElementWidth/2; })
          .text(function(d) { return continentNames[d]; });

      // The text BBox has non-zero values only after rendering
      d3.selectAll("g.continent-key-element text")
          .attr("y", function(d) {
            var textHeight = this.getBBox().height;
            // The BBox.height property includes some extra height we need to remove
            var unneededTextHeight = 4;
            return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
          });
    }

    function translateContinentKey(translation) {
      continentKey
        .transition()
        .duration(500)
        .attr("transform", translation);
    }
  }

  function flagFill() {
    return isChecked("#flags");
  }

  function isChecked(elementID) {
    return d3.select(elementID).property("checked");
  }

  function createCircles() {
    var formatPopulation = d3.format(",");
    circles = svg.selectAll("circle")
      .data(countries)
      .enter()
        .append("circle")
        .attr("r", function(d) { return circleRadiusScale(d.Population); })
        .on("mouseover", function(d) {
          updateCountryInfo(d);
        })
        .on("mouseout", function(d) {
          updateCountryInfo();
        });
    updateCircles();

    function updateCountryInfo(country) {
      var info = "";
      if (country) {
        info = [country.CountryName, formatPopulation(country.Population)].join(": ");
      }
      d3.select("#country-info").html(info);
    }
  }

  function updateCircles() {
    circles
      .attr("fill", function(d) {
        return flagFill() ? "url(#" + d.CountryCode + ")" : continentColorScale(d.ContinentCode);
      });
  }

  function createForces() {
    var forceStrength = 0.05;

    forces = {
      combine:        createCombineForces(),
      countryCenters: createCountryCenterForces(),
      continent:      createContinentForces(),
      population:     createPopulationForces()
    };

    function createCombineForces() {
      return {
        x: d3.forceX(width / 2).strength(forceStrength),
        y: d3.forceY(height / 2).strength(forceStrength)
      };
    }

    function createCountryCenterForces() {
      var projectionStretchY = 0.25,
          projectionMargin = circleSize.max,
          projection = d3.geoEquirectangular()
            .scale((width / 2 - projectionMargin) / Math.PI)
            .translate([width / 2, height * (1 - projectionStretchY) / 2]);

      return {
        x: d3.forceX(function(d) {
            return projection([d.CenterLongitude, d.CenterLatitude])[0];
          }).strength(forceStrength),
        y: d3.forceY(function(d) {
            return projection([d.CenterLongitude, d.CenterLatitude])[1] * (1 + projectionStretchY);
          }).strength(forceStrength)
      };
    }

    function createContinentForces() {
      return {
        x: d3.forceX(continentForceX).strength(forceStrength),
        y: d3.forceY(continentForceY).strength(forceStrength)
      };

      function continentForceX(d) {
        if (d.ContinentCode === "EU") {
          return left(width);
        } else if (d.ContinentCode === "AF") {
          return left(width);
        } else if (d.ContinentCode === "AS") {
          return right(width);
        } else if (d.ContinentCode === "NA" || d.ContinentCode === "SA") {
          return right(width);
        }
        return center(width);
      }

      function continentForceY(d) {
        if (d.ContinentCode === "EU") {
          return top(height);
        } else if (d.ContinentCode === "AF") {
          return bottom(height);
        } else if (d.ContinentCode === "AS") {
          return top(height);
        } else if (d.ContinentCode === "NA" || d.ContinentCode === "SA") {
          return bottom(height);
        }
        return center(height);
      }

      function left(dimension) { return dimension / 4; }
      function center(dimension) { return dimension / 2; }
      function right(dimension) { return dimension / 4 * 3; }
      function top(dimension) { return dimension / 4; }
      function bottom(dimension) { return dimension / 4 * 3; }
    }

    function createPopulationForces() {
      var continentNamesDomain = continents.values().map(function(continentCode) {
        return continentNames[continentCode];
      });
      var scaledPopulationMargin = circleSize.max;

      populationScaleX = d3.scaleBand()
        .domain(continentNamesDomain)
        .range([scaledPopulationMargin, width - scaledPopulationMargin*2]);
      populationScaleY = d3.scaleLog()
        .domain(populationExtent)
        .range([height - scaledPopulationMargin, scaledPopulationMargin*2]);

      var centerCirclesInScaleBandOffset = populationScaleX.bandwidth() / 2;
      return {
        x: d3.forceX(function(d) {
            return populationScaleX(continentNames[d.ContinentCode]) + centerCirclesInScaleBandOffset;
          }).strength(forceStrength),
        y: d3.forceY(function(d) {
          return populationScaleY(d.Population);
        }).strength(forceStrength)
      };
    }

  }

  function createForceSimulation() {
    forceSimulation = d3.forceSimulation()
      .force("x", forces.combine.x)
      .force("y", forces.combine.y)
      .force("collide", d3.forceCollide(forceCollide));
    forceSimulation.nodes(countries)
      .on("tick", function() {
        circles
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });
  }

  function forceCollide(d) {
    return countryCenterGrouping() || populationGrouping() ? 0 : circleRadiusScale(d.Population) + 1;
  }

  function countryCenterGrouping() {
    return isChecked("#country-centers");
  }

  function populationGrouping() {
    return isChecked("#population");
  }

  function addFlagDefinitions() {
    var defs = svg.append("defs");
    defs.selectAll(".flag")
      .data(countries)
      .enter()
        .append("pattern")
        .attr("id", function(d) { return d.CountryCode; })
        .attr("class", "flag")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("patternContentUnits", "objectBoundingBox")
          .append("image")
          .attr("width", 1)
          .attr("height", 1)
          // xMidYMid: center the image in the circle
          // slice: scale the image to fill the circle
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("xlink:href", function(d) {
            return "flags/" + d.CountryCode + ".svg";
          });
  }

  function addFillListener() {
    d3.selectAll('input[name="fill"]')
      .on("change", function() {
        toggleContinentKey(!flagFill() && !populationGrouping());
        updateCircles();
      });
  }

  function addGroupingListeners() {
    addListener("#combine",         forces.combine);
    addListener("#country-centers", forces.countryCenters);
    addListener("#continents",      forces.continent);
    addListener("#population",      forces.population);

    function addListener(selector, forces) {
      d3.select(selector).on("click", function() {
        updateForces(forces);
        toggleContinentKey(!flagFill() && !populationGrouping());
        togglePopulationAxes(populationGrouping());
      });
    }

    function updateForces(forces) {
      forceSimulation
        .force("x", forces.x)
        .force("y", forces.y)
        .force("collide", d3.forceCollide(forceCollide))
        .alphaTarget(0.5)
        .restart();
    }

    function togglePopulationAxes(showAxes) {
      var onScreenXOffset = 40,
          offScreenXOffset = -40;
      var onScreenYOffset = 40,
          offScreenYOffset = 100;

      if (d3.select(".x-axis").empty()) {
        createAxes();
      }
      var xAxis = d3.select(".x-axis"),
          yAxis = d3.select(".y-axis");

      if (showAxes) {
        translateAxis(xAxis, "translate(0," + (height - onScreenYOffset) + ")");
        translateAxis(yAxis, "translate(" + onScreenXOffset + ",0)");
      } else {
        translateAxis(xAxis, "translate(0," + (height + offScreenYOffset) + ")");
        translateAxis(yAxis, "translate(" + offScreenXOffset + ",0)");
      }

      function createAxes() {
        var numberOfTicks = 10,
            tickFormat = ".0s";

        var xAxis = d3.axisBottom(populationScaleX)
          .ticks(numberOfTicks, tickFormat);

        svg.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
          .call(xAxis)
          .selectAll(".tick text")
            .attr("font-size", "16px");

        var yAxis = d3.axisLeft(populationScaleY)
          .ticks(numberOfTicks, tickFormat);
        svg.append("g")
          .attr("class", "y-axis")
          .attr("transform", "translate(" + offScreenXOffset + ",0)")
          .call(yAxis);
      }

      function translateAxis(axis, translation) {
        axis
          .transition()
          .duration(500)
          .attr("transform", translation);
      }
    }
  }

}

