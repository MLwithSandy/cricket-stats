const teamFlags = [
  "🇦🇺",
  "🇬🇧",
  "",
  "🇿🇦",
  "🇮🇳",
  "🇵🇰",
  "🇳🇿",
  "🇱🇰",
  "🇧🇩",
  "🇿🇼",
  "🇦🇫",
  "🇮🇪",
];

const colors = [
  "gold",
  "blue",
  "green",
  "yellow",
  "black",
  "grey",
  "darkgreen",
  "pink",
  "brown",
  "slateblue",
  "grey1",
  "orange",
];

const chartList = [
  "svg-line-chart",
  "svg-bubble-chart",
  "svg-bar-chart-Australia",
  "svg-bar-chart-England",
  "svg-bar-chart-WestIndies",
  "svg-bar-chart-SouthAfrica",
  "svg-bar-chart-India",
  "svg-bar-chart-Pakistan",
  "svg-bar-chart-NewZealand",
  "svg-bar-chart-SriLanka",
  "svg-bar-chart-Bangladesh",
  "svg-bar-chart-Zimbabwe",
  "svg-bar-chart-Afghanistan",
  "svg-bar-chart-Ireland",
];
// Define chart dimension

var xScale,
  yScale,
  xAxisGenerator,
  yAxisGenerator,
  xAccessor,
  yAccessor,
  lineSelector,
  bounds;
var simulation;
var teamData, matchData, teamList, matchDataOverAll, teamResultData;

const chartContainer = "#main-page-chart-containter";
const tooltips = document.querySelectorAll(".custom-tooltip");
const cutOffYear = 2021;

var svg = d3.select("svg");
const dimensions = calculateDimension();
svg.attr("width", dimensions.width).attr("height", dimensions.heigth);

window.onmousemove = (e) => {
  var x = e.clientX + 20 + "px",
    y = e.clientY + 20 + "px";
  for (var i = 0; i < tooltips.length; i++) {
    tooltips[i].style.top = y;
    tooltips[i].style.left = x;
  }
};

async function showMainChart() {
  // read data

  teamData = await d3.csv("teams_overall.csv", (d) =>
    d.Team != "ICC World XI" ? d : null
  );

  teamList = teamData.map((d) => d.Team);

  matchDataOverAll = await d3.csv("match_overall.csv", (d) =>
    d.Team != "All" ? d : null
  );

  teamResultData = await d3.csv("teams.csv");
  teamResultData_fmt = enrichTeamResultData(teamResultData);

  generateLineChart();

  // generateBarChart("South Africa");
}

/*
 Various functions
*/

function firstChart() {
  const chartClass = d3.select(chartContainer).select("svg").attr("class");
  const chartIdx = chartList.indexOf(chartClass);

  if (chartIdx > 0) generateLineChart();
}

function prevChart() {
  const chartClass = d3.select(chartContainer).select("svg").attr("class");
  const chartIdx = chartList.indexOf(chartClass);

  if (chartIdx > 0) showChart(chartIdx > 0 ? chartIdx - 1 : chartIdx);
}

function nextChart() {
  const chartClass = d3.select(chartContainer).select("svg").attr("class");
  const chartIdx = chartList.indexOf(chartClass);

  if (chartIdx < chartList.length - 1)
    showChart(chartIdx < chartList.length - 1 ? chartIdx + 1 : chartIdx);
}

function lastChart() {
  const chartClass = d3.select(chartContainer).select("svg").attr("class");
  const chartIdx = chartList.indexOf(chartClass);

  if (chartIdx < chartList.length - 1) showChart(chartList.length - 1);
}

function showChart(chartIdx) {
  switch (chartList[chartIdx]) {
    case "svg-line-chart":
      generateLineChart();
      break;
    case "svg-bubble-chart":
      generateBubbleChart();
      break;
    case "svg-bar-chart-Australia":
      generateBarChart("Australia");
      break;
    case "svg-bar-chart-England":
      generateBarChart("England");
      break;
    case "svg-bar-chart-WestIndies":
      generateBarChart("West Indies");
      break;
    case "svg-bar-chart-SouthAfrica":
      generateBarChart("South Africa");
      break;
    case "svg-bar-chart-India":
      generateBarChart("India");
      break;
    case "svg-bar-chart-Pakistan":
      generateBarChart("Pakistan");
      break;
    case "svg-bar-chart-NewZealand":
      generateBarChart("New Zealand");
      break;
    case "svg-bar-chart-SriLanka":
      generateBarChart("Sri Lanka");
      break;
    case "svg-bar-chart-Bangladesh":
      generateBarChart("Bangladesh");
      break;
    case "svg-bar-chart-Zimbabwe":
      generateBarChart("Zimbabwe");
      break;
    case "svg-bar-chart-Afghanistan":
      generateBarChart("Afghanistan");
      break;
    case "svg-bar-chart-Ireland":
      generateBarChart("Ireland");
      break;
    default:
      generateLineChart(chartList[chartIdx]);
  }
}

function recycleSvgContainter(svgClass) {
  d3.select(chartContainer).select("svg").remove();

  svg = d3
    .select(chartContainer)
    .append("svg")
    .attr("class", svgClass)
    .attr("width", dimensions.width)
    .attr("height", dimensions.heigth);
}

function generateBarChart(teamName) {
  var data = teamResultData_fmt.filter((f) => f.team == teamName);

  var keys = ["Lost", "Won", "Undecided"];
  const animationSpeed = 0;

  var dataList = data.map((d) => d.values)[0];
  var years = [...new Set(dataList.map((d) => d.Year))];
  var noOfYears = years[years.length - 1] - years[0] + 1;

  var colorScale = {
    Won: "green",
    Lost: "red",
    Undecided: "orange",
  };

  recycleSvgContainter("svg-bar-chart-" + teamName.replace(/\s/g, ""));

  xScale = d3.scaleLinear().range([0, dimensions.boundedWidth]);
  yScale = d3.scaleLinear().range([dimensions.boundedHeight, 0]);

  yAccessor = (d) => d.Mat;
  xAccessor = (d) => d.Year;

  xAxisGenerator = d3.axisBottom().scale(xScale);
  yAxisGenerator = d3.axisLeft().scale(yScale);

  var zScale = d3
    .scaleOrdinal()
    .range([colorScale[keys[0]], colorScale[keys[1]], colorScale[keys[2]]])
    .domain(keys);

  setXYDomain(data);
  yScale.nice();

  // Create a bounding box
  bounds = svg
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
    );

  generateAxis("Year", "#Matches");

  var barWidth =
    (xScale(years[years.length - 1]) - xScale(years[0])) / noOfYears - 2;

  barWidth = barWidth > 10 ? 10 : barWidth;

  bounds
    .selectAll("g.layer")
    .data(d3.stack().keys(keys)(dataList), (d) => d.key)
    .enter()
    .append("g")
    .classed("layer", true)
    .attr("fill", (d) => zScale(d.key));

  bounds
    .selectAll("g.layer")
    .selectAll("rect")
    .data(
      (d) => d,
      (e) => e.data.Year
    )
    .enter()
    .append("rect")
    .attr("width", (d) => barWidth)
    .transition()
    .duration(animationSpeed)
    .attr("x", (d) => xScale(d.data.Year))
    .attr("y", (d) => yScale(d[1]))
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]));

  bounds
    .selectAll(".text")
    .data(dataList)
    .enter()
    .append("text")
    .attr("class", "text")
    .attr("text-anchor", "middle")
    .attr("font-size", 8)
    .transition()
    .duration(animationSpeed)
    .attr("x", (d) => xScale(d.Year) + 5 / 2)
    .attr("y", (d) => yScale(d.Mat) - 5)
    .text((d) => d.Mat);
}

function generateBubbleChart() {
  const formattedTeamData = enrichTeamData(teamData);
  const nodes = generateBubbleNodes(formattedTeamData);
  const center = { x: dimensions.width / 2, y: dimensions.heigth / 2 };

  const forceStrength = 0.04;

  simulation = d3
    .forceSimulation()
    .force(
      "charge",
      d3.forceManyBody().strength((d) => Math.pow(d.radius, 2.0) * 0.04)
    )
    .force("x", d3.forceX().strength(forceStrength).x(center.x))
    .force("y", d3.forceY().strength(forceStrength).y(center.y))
    .force("center", d3.forceCenter(center.x, center.y));

  window.setTimeout(function () {
    simulation = simulation.force(
      "collision",
      d3.forceCollide().radius((d) => d.radius * 1.25)
    );
  }, 800);

  recycleSvgContainter(chartList[1]);

  drawBubbleChart(nodes);
}

function drawBubbleChart(nodes) {
  const elements = svg
    .selectAll(".bubble")
    .data(nodes, (d) => d.Team)
    .enter()
    .append("g");

  const bubbles = elements
    .append("circle")
    .classed("bubble", true)
    // .attr("r", (d) => d.radius)
    .attr("r", (d) => {
      // console.log("start", d);
      return d.radius;
    })
    .attr("team-id", (d) => d.Team)
    .attr("fill", (d) => d.Color)
    .attr("stroke", (d) => d.Color)
    .attr("stroke-width", 4)
    .on("mouseover", handleMouseOverBubble)
    .on("mouseout", handleMouseOutBubble)
    .on("click", handleMouseClick);

  // labels
  const labels = elements
    .append("text")
    .attr("team-id", (d) => d.Team)
    .classed("bubble-label", true)
    .attr("dy", ".3em")
    .attr("id", (d) => "bubble-label-" + d.Team)
    .style("text-anchor", "middle")
    .style("font-size", 20)
    .style("fill", (d) => d.Color)
    .text((d) => (d.Mat > 45 ? d.Flag : ""))
    .on("mouseover", handleMouseOverBubble)
    .on("mouseout", handleMouseOutBubble)
    .on("click", handleMouseClick);

  simulation
    .nodes(nodes)
    .on("tick", () => {
      bubbles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    })
    .restart();
}

function generateBubbleNodes(data) {
  const maxSize = d3.max(data, (d) => 4 + d.Mat * 5);

  const radiusScale = d3
    .scaleSqrt()
    .domain([0, maxSize])
    .range([0, dimensions.heigth / 9]);

  const bubbleChartNodes = data.map((d) => ({
    ...d,
    radius: radiusScale(4 + d.Mat * 5),
    x: (Math.random() - 0.5) * dimensions.width,
    y: (Math.random() - 0.5) * dimensions.heigth,
  }));
  return bubbleChartNodes;
}

function generateLineChart(dataPoint) {
  //data preparation
  matchData = enrichMatchData(matchDataOverAll);

  recycleSvgContainter(chartList[0]);

  yAccessor = (d) => (dataPoint == "#Matches" ? d.CumMats : d.CumRuns);
  xAccessor = (d) => d.Year;
  xScale = d3.scaleLinear().range([0, dimensions.boundedWidth]);
  yScale = d3.scaleLinear().range([dimensions.boundedHeight, 0]);
  xAxisGenerator = d3.axisBottom().scale(xScale).ticks(13);
  yAxisGenerator = d3.axisLeft().scale(yScale);

  lineSelector = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  // Create a bounding box
  bounds = svg
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
    );

  // domain and range of scales
  setXYDomain(matchData);

  // draw team based chart
  drawLineChart(matchData, [handleMouseOver, handleMouseOut, handleMouseClick]);

  // Create X & Y Axis
  generateAxis("Year", dataPoint == "#Matches" ? dataPoint : "#Runs");

  // Create Gridlines
  generateGridLines();

  // Create Annotations
  generateAnnotations();
}

function drawLineChart(data, mouseHandlers) {
  // console.log(data);

  const lines = bounds
    .selectAll("g")
    .data(data)
    .enter()
    .append("g")
    .append("path")
    .attr("fill", "none")
    .attr("stroke", (d) => d.color)
    .attr("stroke-width", 3)
    .attr("class", "chartLine")
    .attr("d", (d) => lineSelector(d.values))
    .attr("team-id", (d) => d.team)
    .on("mouseover", mouseHandlers[0])
    .on("mouseout", mouseHandlers[1])
    .on("click", mouseHandlers[2]);

  const texts = bounds
    .selectAll("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("text-anchor", "left")
    .selectAll("text")
    .data((d) => {
      var latestYear = d3.max(d.values, function (t) {
        return t.Year;
      });

      return d.values.filter((t) => t.Year == latestYear && t.Team == d.team);
    })
    .enter()
    .append("text")
    .attr("x", (d) =>
      xScale(xAccessor(d) < cutOffYear ? cutOffYear : xAccessor(d))
    )
    .attr("y", (d) => yScale(yAccessor(d)))
    .attr("transform", "translate(10, 0)")
    .style("fill", (d) => d.Color)
    .text((d) => d.Team + " " + teamFlags[teamList.indexOf(d.Team)])
    .on("mouseover", mouseHandlers[0])
    .on("mouseout", mouseHandlers[1])
    .on("click", mouseHandlers[2]);
}

function setXYDomain(data) {
  yScale.domain([
    // d3.min(data, (c) => d3.min(c.values, yAccessor)),
    0,
    d3.max(data, (c) => d3.max(c.values, yAccessor)),
  ]);

  xScale.domain([
    d3.min(data, (c) => d3.min(c.values, xAccessor)),
    d3.max(data, (c) => d3.max(c.values, xAccessor)),
  ]);
}

function generateAxis(xAxisLabel, yAxisLabel) {
  // Create X & Y Axis
  const yAxis = bounds
    .append("g")
    .attr("class", "axis")
    .attr("class", "yAxis")
    .call(yAxisGenerator);

  const xAxis = bounds
    .append("g")
    .attr("class", "axis")
    .attr("class", "xAxis")
    .call(xAxisGenerator.tickFormat(d3.format("d")))
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  yAxis
    .append("text")
    .attr("x", -40)
    .attr("y", dimensions.boundedHeight / 2)
    .attr("fill", "currentColor")
    .attr("text-anchor", "end")
    .attr("transform", (d, i) => {
      return (
        "translate( " +
        -(dimensions.boundedWidth / 2 - 15) +
        " , " +
        (dimensions.boundedHeight / 2 - 50) +
        ")," +
        "rotate(-90)"
      );
    })
    .text(yAxisLabel);

  xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "currentColor")
    .attr("text-anchor", "end")
    .text(xAxisLabel);
}

function generateGridLines() {
  bounds
    .append("g")
    .attr("class", "grid")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator.tickSize(-dimensions.boundedHeight).tickFormat(""));

  bounds
    .append("g")
    .attr("class", "grid")
    .call(yAxisGenerator.tickSize(-dimensions.boundedWidth).tickFormat(""));
}

function generateAnnotations() {
  const annotations = [
    {
      note: {
        label:
          "The anti-apartheid movement led the ICC to impose a moratorium on South Africa 🇿🇦 tours.",
        title: "The international ban 1970 - 1990",
      },
      x: 435,
      y: 418,
      dy: -80,
      dx: -100,
    },
    {
      note: {
        label: "Two test playing nations: England 🇬🇧 & Australia 🇦🇺",
        title: "1887",
      },
      x: 5,
      y: 500,
      dy: -80,
      dx: +30,
    },
  ];

  const makeAnnotations = d3
    .annotation()
    // .editMode(true)
    .annotations(annotations);

  bounds.append("g").attr("class", "annotation-group").call(makeAnnotations);
}

function handleMouseOver(d, i) {
  var selectedTeamData = teamData.filter(
    (t) => t["Team"] == (d.team || d.Team)
  );

  document.getElementById("team-details").classList.remove("closed");
  document.getElementById("td-team-name").innerHTML = d.team || d.Team;
  document.getElementById("td-test-status-year").innerHTML =
    selectedTeamData.map((t) => "Started in " + t["Span"].split("-")[0]);

  document.getElementById("td-team-runs").innerHTML = (
    d.CumRuns ||
    d3.max(d.values, function (t) {
      return t.CumRuns;
    })
  ).toLocaleString();
  document.getElementById("td-team-matches").innerHTML = (
    d.CumMats ||
    d3.max(d.values, function (t) {
      return t.CumMats;
    })
  ).toLocaleString();
  document.getElementById("td-team-won").innerHTML = Number(
    selectedTeamData.map((t) => t["Won"])
  ).toLocaleString();
  document.getElementById("td-team-lost").innerHTML = Number(
    selectedTeamData.map((t) => t["Lost"])
  ).toLocaleString();
  document.getElementById("td-team-undecided").innerHTML = Number(
    selectedTeamData.map((t) => Number(t["Tied"]) + Number(t["Draw"]))
  ).toLocaleString();
}

function handleMouseOut(d, i) {
  document.getElementById("team-details").classList.add("closed");
  document.getElementById("td-team-name").innerHTML = "";
  document.getElementById("td-test-status-year").innerHTML = "";
  document.getElementById("td-team-runs").innerHTML = "";
  document.getElementById("td-team-matches").innerHTML = "";
  document.getElementById("td-team-won").innerHTML = "";
  document.getElementById("td-team-lost").innerHTML = "";
  document.getElementById("td-team-undecided").innerHTML = "";
}

function handleMouseClick(d, i) {
  const idx = teamList.indexOf(d.team || d.Team);
  showChart(idx + 2);
}

// Create Event Handlers for mouse
function handleMouseOverBubble(d, i) {
  d3.select(this).attr("r", d.radius * 1.2);

  document.getElementById("team-details").classList.remove("closed");
  document.getElementById("td-team-name").innerHTML = d.Team;
  document.getElementById("td-test-status-year").innerHTML =
    "Started in " + d.StartYear;

  document.getElementById("td-team-matches").innerHTML = d.Mat.toLocaleString();
  document.getElementById("td-team-won").innerHTML = d.Won.toLocaleString();
  document.getElementById("td-team-lost").innerHTML = d.Lost.toLocaleString();
  document.getElementById("td-team-undecided").innerHTML =
    d.Undecided.toLocaleString();
  document.getElementById("row-runs").style.display = "none";
}

function handleMouseOutBubble(d, i) {
  handleMouseOut(d, i);
  document.getElementById("row-runs").style.display = "";
  d3.select(this).attr("r", d.radius);
}

function handleMouseClickBubble(d, i) {
  handleMouseClick(d, i);
}

function enrichMatchData(data) {
  var prevTeam = "";
  data.forEach(function (d, i) {
    // console.log(prevTeam, d.Team);
    if (prevTeam != d.Team) {
      prevRunSum = 0;
      prevMatSum = 0;
    }
    d.CumRuns = prevRunSum + parseInt(d.Runs);
    d.CumMats = prevMatSum + parseInt(d.Mat);
    prevTeam = d.Team;
    prevRunSum = d.CumRuns;
    prevMatSum = d.CumMats;
    d.AvgRun = d.Runs / d.Mat;
  });

  var teamMatchData = [];
  teamList.forEach((d, i) => {
    let td = data.filter((t) => t["Team"] == d);

    teamMatchData.push({
      team: d,
      values: td.map((t) => ({
        Team: d,
        Year: Number(t.Year),
        CumMats: Number(t.CumMats),
        CumRuns: Number(t.CumRuns),
        Color: colors[i],
      })),
      color: colors[i],
    });
  });

  return teamMatchData;
}

function enrichTeamResultData(data) {
  var teamMatchData = [];
  teamList.forEach((d, i) => {
    let td = data.filter((t) => t["Team"] == d);

    teamMatchData.push({
      team: d,
      values: td.map((t) => ({
        Team: d,
        Year: Number(t.Year),
        Mat: Number(t.Mat),
        Won: Number(t.Won),
        Lost: Number(t.Lost),
        Undecided: Number(t.Undecided),
        Flag: teamFlags[i],
        Color: colors[i],
      })),
      color: colors[i],
    });
  });

  return teamMatchData;
}

function enrichTeamData(data) {
  var teamMatchData = [];

  // console.log(data);

  data.forEach((d, i) => {
    teamMatchData.push({
      Team: d.Team,
      StartYear: d.Span.split("-")[0],
      Mat: Number(d.Mat),
      Won: Number(d.Won),
      Lost: Number(d.Lost),
      Undecided: Number(d.Tied) + Number(d.Draw),
      Color: colors[i],
      Flag: teamFlags[i],
    });
  });

  return teamMatchData;
}

function calculateDimension() {
  let dimensions = {
    width: svg.attr("width"),
    heigth: svg.attr("height"),
    margin: {
      top: 50,
      right: 80,
      bottom: 50,
      left: 80,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;

  dimensions.boundedHeight =
    dimensions.heigth - dimensions.margin.top - dimensions.margin.bottom;

  return dimensions;
}
