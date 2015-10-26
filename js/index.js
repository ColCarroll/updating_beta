var spacing = 32,
    ticker = {},
    graphic = {};

graphic.create = function() {
    var elt = $('#graphic');
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = elt.width() - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        xMap = function(d){return d.x;},
        yMap = function(d){return d.y;},
        xVal = function(d){return x(xMap(d))},
        yVal = function(d){return y(yMap(d))};

    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom");

    var line = d3.svg.line()
        .interpolate('basis')
        .x(xVal)
        .y(yVal);

    var g = d3.select("#graphic")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width - 5);

    var path = g.append("g")
        .append("path")
        .attr("class", "line");

    var bottomPath = g.append("g")
        .append("path")
        .attr("class", "line")
        .style("stroke", "red");

    var topPath = g.append("g")
        .append("path")
        .attr("class", "line")
        .style("stroke", "red");

    function update(data, heads, tails, chance){
        var speed = $('#speedInput').val() * 0.8;
        var yMax = d3.max(data, yMap);
        x.domain(d3.extent(data, xMap));
        y.domain([0, d3.max(data, yMap)]);
        var topData = [
            {x: chance, y: beta(chance, heads, tails), alpha: 0.5},
            {x: chance, y: yMax, alpha: 0.5}
        ];
        var bottomData = [
            {x: chance, y: 0, alpha: 0.5},
            {x: chance, y: beta(chance, heads, tails), alpha: 0.5}
        ];

        path
            .datum(data)
            .transition()
            .duration(speed)
            .attr("class", "line")
            .attr("d", line);

        bottomPath
            .datum(bottomData)
            .transition()
            .duration(speed)
            .attr("class", "line")
            .attr("d", line);

        topPath
            .datum(topData)
            .transition()
            .duration(speed)
            .attr("class", "line")
            .attr("d", line)
            .attr("opacity", 0.2);

        g.selectAll("g.x.axis")
            .call(xAxis);
    }

    return update;
};


ticker.create = function() {
    ticker.svg = d3.select("#text")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    return ticker.svg.append("g")
};

ticker.update = function(g, data) {
    var width = $('#text').width() - 40;
    var speed = $('#speedInput').val() * 0.5;
    var text = g.selectAll("text")
        .data(data, function(d) {return d.idx;});

    // UPDATE
    // Update old elements as needed.
    text.attr("class", "update")
        .transition()
        .duration(speed)
        .attr("x", function(d, i) { return width - i * spacing; });

    // ENTER
    // Create new elements as needed.
    text.enter().append("text")
        .attr("class", "enter")
        .attr("dy", ".35em")
        .attr("y", 0)
        .attr("x", function(d, i) { return width - i * spacing; })
        .style("fill-opacity", 1e-6)
        .text(function(d) { return d.label; })
        .transition()
        .duration(speed)
        .attr("y", 40)
        .style("fill-opacity", 1);

    // EXIT
    // Remove old elements as needed.
    text.exit()
        .attr("class", "exit")
        .transition()
        .duration(speed)
        .attr("y", 80)
        .style("fill-opacity", 1e-6)
        .remove();
};

flipper = function(chance, count){ return {
    label: Math.random() < chance ? "H":"T",
    idx: count
};};

computeHeads = function(nums) {
    return d3.sum(nums.map(function (d) {
        return d.label == "H" ? 1 : 0;
    }));
};

computeProb = function(nums){
    var tot = nums.length;
    return (computeHeads(nums) / tot).toFixed(3);
};

beta = function(x, a, b){
    return Math.pow(x, a) * Math.pow(1 - x, b);
};
updateData = function(heads, tails, data){
    return data.map(function(d){return {x: d.x, y: beta(d.x, heads, tails)}});
};

getMemory = function(){
    return $("#memoryInput").val();
};

run = function(){
    var count = 0,
        heads = 0,
        tails = 0,
        memory = getMemory(),
        chance = $("#chanceInput").val(),
        newVal = flipper(chance, count++),
        nums = [newVal];

    var lineData = d3.range(0, 1, 0.01).map(function(d){return {x: d, y: d * d};});
    lineData = updateData(heads, tails, lineData);

    var updateGraph = graphic.create();
    updateGraph(lineData, heads, tails, chance);
    var g = ticker.create();
    ticker.update(g, nums);
    // Grab a random sample of letters from the alphabet, in alphabetical order.

  var t = setInterval(loop, $("#speedInput").val());

  $("#speedInput").on("change", function() {
    clearInterval(t);
    t = setInterval(loop, $("#speedInput").val());
    $("#resumeButton").addClass("hidden");
    $("#pauseButton").removeClass("hidden");
  });

  $("#pauseButton").on("click", function() {
    $(".btn").toggleClass("hidden");
    clearInterval(t);
  });

  $("#resumeButton").on("click", function() {
    $(".btn").toggleClass("hidden");
    t = setInterval(loop, $("#speedInput").val());
  });

  function loop() {
    chance = $("#chanceInput").val();
    newVal = flipper(chance, count++);
    nums.unshift(newVal);
    heads = computeHeads(nums);
    tails = nums.length - heads;

    memory = getMemory();
    if(memory > 0) {
      nums = nums.slice(0, memory);
    }

    lineData = updateData(heads, tails, lineData);
    updateGraph(lineData, heads, tails, Math.round(100 * chance) / 100);
    ticker.update(g, nums);

    $('#observedProb').text(computeProb(nums));
    $('#observedHeads').text(heads);
    $('#observedTails').text(tails);
  }

};

addLabel = function(label, input){
    label.text(input.val());
    input.on('input', function(){
        label.text($(this).val());
    })
};

$(document).ready(function() {
    addLabel($('#memoryLabel'), $('#memoryInput'));
    addLabel($('#chanceLabel'), $('#chanceInput'));
    addLabel($('#speedLabel'), $('#speedInput'));
    return run();
});
