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
// Define chart dimension

var svg = d3.select("svg");
const tooltips = document.querySelectorAll(".custom-tooltip");
const cutOffYear = 2021;

const dimensions = calculateDimension();

const yAccessor = (d) => d.CumMats;
const xAccessor = (d) => d.Year;
const array_column = (array, column) => array.map((e) => e[column]);
var teamData, matchData, teamList;
const xScale = d3.scaleLinear().range([0, dimensions.boundedWidth]);
const yScale = d3.scaleLinear().range([dimensions.boundedHeight, 0]);
const xAxisGenerator = d3.axisBottom().scale(xScale).ticks(13);
const yAxisGenerator = d3.axisLeft().scale(yScale);

var simulation;

const lineSelector = d3
  .line()
  .x((d) => xScale(xAccessor(d)))
  .y((d) => yScale(yAccessor(d)));

window.onmousemove = (e) => {
  var x = e.clientX + 20 + "px",
    y = e.clientY + 20 + "px";
  for (var i = 0; i < tooltips.length; i++) {
    tooltips[i].style.top = y;
    tooltips[i].style.left = x;
  }
};

svg.attr("width", dimensions.width).attr("height", dimensions.heigth);

// Create a bounding box
const bounds = svg
  .append("g")
  .style(
    "transform",
    `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
  );

async function showMainChart() {
  // read data
  var matchDataOverAll = await d3.csv("match_overall.csv", (d) =>
    d.Team != "All" ? d : null
  );
  teamData = await d3.csv("teams_overall.csv", (d) =>
    d.Team != "ICC World XI" ? d : null
  );
  teamList = teamData.map((d) => d.Team);

  // generateLineChart(matchDataOverAll);

  generateBubbleChart();
}

/*
 Various functions
*/

function generateBubbleChart() {
  var formattedTeamData = enrichTeamData(teamData);
  console.table(formattedTeamData);

  drawBubbleChart(formattedTeamData, "#page-1-vis");
}

function drawBubbleChart(data, visId) {
  let forceStrength = 0.04;

  const center = { x: dimensions.width / 2, y: dimensions.heigth / 2 };

  let svg = null;
  let bubbles = null;

  let labels = null;
  let nodes = [];

  simulation = d3
    .forceSimulation()
    .force(
      "charge",
      d3.forceManyBody().strength((d) => Math.pow(d.radius, 2.0) * 0.04)
    )
    .force("x", d3.forceX().strength(forceStrength).x(center.x))
    .force("y", d3.forceY().strength(forceStrength).y(center.y))
    .force("center", d3.forceCenter(center.x, center.y));

  if (visId == "#page-1-vis") {
    window.setTimeout(function () {
      simulation = simulation.force(
        "collision",
        d3.forceCollide().radius((d) => d.radius * 1.25)
      );
    }, 500);
  } else {
    simulation = simulation.force(
      "collision",
      d3.forceCollide().radius((d) => d.radius * 1.25)
    );
  }

  chart("#main-page-chart-containter", data);
}

function chart(selector, data) {
  nodes = generateNodes(data);

  console.log(nodes);
  console.log(d3.select(selector).select("svg"));

  d3.select(selector).select("svg").remove();

  svg = d3
    .select(selector)
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.heigth);

  const elements = svg
    .selectAll(".bubble")
    .data(nodes, (d) => {
      console.log(d);
      return d.Team;
    })
    .enter()
    .append("g");

  bubbles = elements
    .append("circle")
    .classed("bubble", true)
    .attr("r", (d) => d.radius)
    .attr("team-id", (d) => d.Team)
    .attr("fill", "purple")
    .attr("stroke", (d) => d.Color)
    .attr("stroke-width", 4);

  simulation
    .nodes(nodes)
    .on("tick", () => {
      bubbles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      // labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    })
    .restart();

  // console.log(svg);
}

function generateNodes(data) {
  const maxSize = d3.max(data, (d) => 4 + d.Mat * 5);
  console.log(maxSize);

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

function generateLineChart(matchDataOverAll) {
  //data preparation
  matchData = enrichMatchData(matchDataOverAll);

  // domain and range of scales
  setXYDomain(matchData);

  // draw team based chart
  drawLineChart(matchData, [handleMouseOver, handleMouseOut, handleMouseClick]);

  // Create X & Y Axis
  generateAxis(xScale, yScale, "Year", "#Matches");

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
    d3.min(data, function (c) {
      return d3.min(c.values, function (d) {
        return d.CumMats;
      });
    }),
    d3.max(data, function (c) {
      return d3.max(c.values, function (d) {
        return d.CumMats;
      });
    }),
  ]);

  xScale.domain([
    d3.min(data, function (c) {
      return d3.min(c.values, function (d) {
        return d.Year;
      });
    }),

    d3.max(data, function (c) {
      return d3.max(c.values, function (d) {
        return d.Year;
      });
    }),
  ]);
}

function generateAxis(xScale, yScale, xAxisLabel, yAxisLabel) {
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
        -(dimensions.boundedWidth / 2 - 30) +
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
  console.log("click: ", d, i);
  // let split_path = window.location.pathname.split("/");
  // let redirectPath = split_path.slice(0, split_path.length - 1);
  // redirectPath.push("constructor_drivers.html");
  // let basePath =
  //   redirectPath.join("/") + `?c=${this.getAttribute("constructor-id")}`;
  // window.location = basePath;
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

function enrichTeamData(data) {
  var teamMatchData = [];

  // console.log(data);

  data.forEach((d, i) => {
    teamMatchData.push({
      Team: d.Team,
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
