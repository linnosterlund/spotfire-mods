
//const xScale = d3.select("#x-scale");
//const yScale = d3.select("#y-scale");

/**
 * A container for X axis labels.
 * Instead of figuring out the layout in special cases when labels don't fit, we delegate
 * this job to the DOM layout engine.
 */
//const xLabelsContainer = modContainer.append("div").attr("class", "x-axis-label-container");
/**
 * @param {number} xScaleHeight
 * @param {number} yScaleWidth
 * @param {number} xTitleHeight
 * @param {Spotfire.Size} size
 * @param {string[]} categories
 * @param {Spotfire.ModProperty<string>} xAxisMode
 * @param {Spotfire.ModProperty<boolean>} chartMode
 * @param {Spotfire.ModProperty<boolean>} titleMode
 * @param {Spotfire.ModProperty<boolean>} showLabel
 * @param {Spotfire.ModProperty<boolean>} reverse
 * @param {Spotfire.ModProperty<boolean>} sort
 * @param {number} totalValue
 * @param {number} maxYValue
 * @param {Spotfire.Mod} mod
 */
function renderAxis(xScaleHeight, yScaleWidth, xTitleHeight, size, categories, xAxisMode, chartMode, titleMode, showLabel, reverse, sort, totalValue, maxYvalue, mod){
    //variables
    const context = mod.getRenderContext();
    const styling = context.styling;
    const margin = { top: xTitleHeight, right: 40, bottom: xScaleHeight, left: yScaleWidth - 1}
    var width = size.width - margin.right;
    var height = size.height - margin.top;

    //remove previous content in svg
    d3.selectAll("#scale > *").remove();

    //svg container for the scales
    var svg = d3.select("#scale")
        .attr("width", width)
        .attr("height", height)

    //render x axis different depending on configuration
    if (xAxisMode.value() === "percentage"){
        var xFormat = d3.format(".0%");
        var xscale = d3.scaleLinear()
        .domain([0, 1])
        .range([margin.left, width]);
    } else if (xAxisMode.value() === "numeric"){
        var xFormat = null;
        var xscale = d3.scaleLinear()
        .domain([0, totalValue])
        .range([margin.left, width]);
    }
    
    var x_axis = d3.axisBottom()
            .tickSize(5)
            .tickFormat(xFormat)
            .tickPadding(styling.scales.tick.stroke != "none" ? 3 : 9)
            .scale(xscale); 

    //render y axis different depending on chart mode
    if (!chartMode.value()){
        var yFormat = d3.format(".0%");
        var yscale = d3.scaleLinear()
        .domain([1, 0])
        .range([margin.top, height - margin.bottom]);
    } else {
        var yFormat = null;
        var yscale = d3.scaleLinear()
            .domain([maxYvalue, 0]).nice()
            .range([margin.top, height - margin.bottom]);
    }

    var y_axis = d3.axisLeft()
            .ticks(10)
            .tickFormat(yFormat)
            .scale(yscale);

    //append y axis to svg
    svg.append("g")
        .attr("id", "y-axis")
        .attr("transform", "translate(" + margin.left +","+ margin.top +")")
        .call(y_axis)
        .selectAll("text")
        .attr("tooltip", (d) => d)
        .on("mouseover", function (d) {
            if(!chartMode.value()){d = d * 100 + "%";}
            mod.controls.tooltip.show(d);
        })
        .on("mouseout", function () {
            mod.controls.tooltip.hide();
        });
    
    var xVerticalPlacement = height - margin.bottom;

    //append x axis to svg
    svg.append("g")
        .attr("id", "x-axis")
        .attr("transform", "translate( 0, " + xVerticalPlacement + ")")
        .call(x_axis)
        .selectAll("text")
        .attr("tooltip", (d) => d)
        .on("mouseover", function (d) {
            if(xAxisMode.value() === "percentage"){d = d * 100 + "%";}
            mod.controls.tooltip.show(d);
        })
        .on("mouseout", function () {
            mod.controls.tooltip.hide();
        });

    /**
     * Show popup on X axis click
     * @type {HTMLElement}
     */
    const xAxisSelect = document.querySelector("#x-axis");
    xAxisSelect.classList.toggle("editable", context.isEditing);

    xAxisSelect.oncontextmenu = function (e) {
        e.preventDefault(); // Prevents browser native context menu from being shown.
        e.stopPropagation(); // Prevents default mod context menu to be shown.

        mod.controls.contextMenu
            .show(e.clientX, e.clientY, [
                {
                    text: "Percentage",
                    checked: xAxisMode.value() === "percentage",
                    enabled: xAxisMode.value() !== "percentage"
                },
                {
                    text: "Numeric",
                    checked: xAxisMode.value() === "numeric",
                    enabled: xAxisMode.value() !== "numeric"
                },
                {
                    text: "Marimekko Chart",
                    checked: !chartMode.value(),
                    enabled: chartMode.value()
                },
                {
                    text: "Mekko Chart",
                    checked: chartMode.value(),
                    enabled: !chartMode.value()
                },
                {
                    text: "Sort bars by value",
                    checked: sort.value(),
                    enabled: true
                },
                {
                    text: "Reverse Scale",
                    checked: reverse.value(),
                    enabled: true
                },
                {
                    text: "Show Category Title",
                    checked: titleMode.value(),
                    enabled: true
                }
            ])
            .then((clickedItem) => {
                if (clickedItem.text === "Percentage") {
                    xAxisMode.set("percentage");
                } else if (clickedItem.text === "Numeric") {
                    xAxisMode.set("numeric");
                }
                if (clickedItem.text === "Marimekko Chart") {
                    chartMode.set(false);
                } else if (clickedItem.text === "Mekko Chart") {
                    chartMode.set(true);
                }
                if (clickedItem.text === "Sort bars by value") {
                    sort.set(!sort.value());
                } 
                if (clickedItem.text === "Reverse scale") {
                    reverse.set(!reverse.value());
                } 
                if (clickedItem.text === "Show Category Title") {
                    titleMode.set(!titleMode.value());
                } 
            });
    };

    xAxisSelect.onclick = (e) => {
        if (!context.isEditing) {
            return;
        }

        mod.controls.tooltip.hide();
        let factory = mod.controls.popout.components;
        let section = mod.controls.popout.section;
        let box = xAxisSelect.getBoundingClientRect();
        mod.controls.popout.show(
            {
                x: e.clientX,
                y: box.top,
                autoClose: true,
                alignment: "Bottom",
                onChange: (e) => {
                if (e.name === "scale") {
                    xAxisMode.set(e.value);
                } else if (e.name === "chart") {
                    chartMode.set(e.value);
                } else if (e.name === "title") {
                    titleMode.set(e.value);
                } else if (e.name === "sort") {
                    sort.set(e.value);
                } else if (e.name === "reverse") {
                    reverse.set(e.value);
                }
                }
            },
            () => {
            return [
                section({
                    heading: "Scale mode",
                    children: [
                        factory.radioButton({
                            name: "scale",
                            text: "Percentage",
                            value: "percentage",
                            checked: xAxisMode.value() === "percentage"
                        }),
                        factory.radioButton({
                            name: "scale",
                            text: "Numeric",
                            value: "numeric",
                            checked: xAxisMode.value() === "numeric"
                        })
                    ]
                }),
                section({
                    heading: "Chart Type",
                    children: [
                        factory.radioButton({
                            name: "chart",
                            text: "Marimekko Chart",
                            value: false,
                            checked: chartMode.value() === false
                        }),
                        factory.radioButton({
                            name: "chart",
                            text: "Mekko Chart",
                            value: true,
                            checked: chartMode.value() === true
                        })
                    ]
                }),
                section({
                    children: [
                        factory.checkbox({
                            name: "sort",
                            text: "Sort bars by value",
                            checked: sort.value() === true,
                            enabled: true
                        })
                    ]
                }),
                section({
                    children: [
                        factory.checkbox({
                            name: "reverse",
                            text: "Reverse scale",
                            checked: reverse.value() === true,
                            enabled: true
                        })
                    ]
                }),
                section({
                    children: [
                        factory.checkbox({
                            name: "title",
                            text: "Show Category Titles",
                            checked: titleMode.value() === true,
                            enabled: true
                        }),
                    ]
                })
            ];
            }
        );
    };

    /**
     * Show popup on Y axis click
     * @type {HTMLElement}
     */
    const yAxisSelect = document.querySelector("#y-axis");
    yAxisSelect.classList.toggle("editable", context.isEditing);

    yAxisSelect.oncontextmenu = function (e) {
    e.preventDefault(); // Prevents browser native context menu from being shown.
    e.stopPropagation(); // Prevents default mod context menu to be shown.

    mod.controls.contextMenu
        .show(e.clientX, e.clientY, [
            {
                text: "Show value of bar",
                checked: showLabel.value(),
                enabled: true
            }
        ])
        .then((clickedItem) => {
            if (clickedItem.text === "Show value of bar") {
                showLabel.set(!showLabel.value());
            }
        });
    };

    yAxisSelect.onclick = function (e) {
    if (!context.isEditing) {
        return;
    }

    mod.controls.tooltip.hide();
    let factory = mod.controls.popout.components;
    let section = mod.controls.popout.section;
    let box = yAxisSelect.getBoundingClientRect();

    mod.controls.popout.show(
        {
            x: box.width + box.left,
            y: e.clientY,
            autoClose: true,
            alignment: "Left",
            onChange(e) {
                if (e.name === "value") {
                    showLabel.set(e.value);
                } 
            }
        },
        () => {
            return [
                section({
                    heading: "Segment style",
                    children: [
                        factory.checkbox({
                            name: "value",
                            text: "Show values of segments",
                            checked: showLabel.value() === true,
                            enabled: true
                        }),
                    ]
                })
            ];
        }
    );
    };
}

