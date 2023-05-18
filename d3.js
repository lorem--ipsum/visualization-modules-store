import "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.4/d3.js";
import d3hexbin from "https://cdnjs.cloudflare.com/ajax/libs/d3-hexbin/0.2.2/d3-hexbin.js";
import {
  L,
  SqlFunction,
} from "https://cdn.jsdelivr.net/npm/druid-query-toolkit@0.18.11/+esm";

function draw(data, margin, height, width, radius, group, xAxis, yAxis) {
  const x = d3
    .scaleLog()
    .domain(d3.extent(data, (d) => d.x))
    .rangeRound([0, width - margin.left - margin.right]);

  const y = d3
    .scaleLog()
    .domain(d3.extent(data, (d) => d.y))
    .rangeRound([height - margin.top - margin.bottom, 0]);

  const hexbin = d3hexbin()
    .x((d) => x(d.x))
    .y((d) => y(d.y))
    .radius((radius * width) / (height - 1))
    .extent([
      [0, 0],
      [width, height],
    ]);

  const bins = hexbin(data);

  const color = d3
    .scaleSequential(d3.interpolateBuPu)
    .domain([0, d3.max(bins, (d) => d.length) / 2]);

  group
    .selectAll("path")
    .data(bins)
    .join("path")
    .attr("d", hexbin.hexagon())
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .attr("fill", (d) => color(d.length));

  xAxis
    .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80, ""))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", width)
        .attr("y", -4)
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(data.x)
    );

  yAxis
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(y).ticks(null, ".1s"))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", 4)
        .attr("y", 0)
        .attr("dy", ".71em")
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text(data.y)
    );
}

const Thing = {
  parameters: {
    ordinate: {
      type: "column",
      control: {
        label: "Ordinate",
      },
    },

    abscissa: {
      type: "column",
      control: {
        label: "Abscissa",
      },
    },

    radius: {
      type: "number",
      default: 6,
      min: 1,
      control: {
        label: "Radius",
      },
    },
  },
  module: ({ container, host }) => {
    const sqlQuery = (() => {
      let lastQuery;
      let lastResult;
      return async (query) => {
        if (query === lastQuery) return lastResult;

        lastQuery = query;
        lastResult = await host.sqlQuery(query);
        return lastResult;
      };
    })();

    const { width, height } = container.getBoundingClientRect();
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };

    // append the svg object to the body of the page
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.1);

    const xAxis = svg.append("g");

    const yAxis = svg.append("g");

    let data;

    return {
      async update({ table, where, params, context }) {
        const { radius, abscissa, ordinate } = params;

        if (!abscissa || !ordinate) return;

        if (!context.maxTime) return;

        const rawData = await sqlQuery(
          `SELECT
              ${ordinate.expression} AS "y",
              ${abscissa.expression} AS "x"
            FROM ${table}
            where ${where
              .toString()
              .replaceAll("MAX_DATA_TIME()", L(new Date(context.maxTime)))}
              and ${abscissa.expression} != 0
              and ${ordinate.expression} != 0
            LIMIT 20000`
        );

        if (!rawData) return;

        data = rawData.toObjectArray();

        draw(data, margin, height, width, radius, g, xAxis, yAxis);
      },

      resize(rect, { params }) {
        const margin = { top: 10, right: 30, bottom: 30, left: 40 };
        const width = rect.width - margin.left - margin.right;
        const height = rect.height - margin.top - margin.bottom;

        svg
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);

        draw(data, margin, height, width, params.radius, g);
      },

      async destroy() {},
    };
  },
};

export default {
  component: Thing,
  iconUrl: "http://localhost:3000/swift-square.svg",
  label: "d3 demo",
  moduleName: "dynamic-module-3",
};
