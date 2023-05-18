import { L } from "https://cdn.jsdelivr.net/npm/druid-query-toolkit@0.18.11/+esm";

const Thing = {
  parameters: {
    timeGranularity: {
      type: "option",
      options: ["PT1M", "PT5M", "PT1H", "P1D"],
      default: "PT1H",
      control: {
        optionLabels: {
          PT1M: "Minute",
          PT5M: "5 minutes",
          PT1H: "Hour",
          P1D: "Day",
        },
      },
    },
  },
  module: ({ container, host }) => {
    let chart;
    let data;
    let options;

    // load google stuff
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.gstatic.com/charts/loader.js";
    script.addEventListener("load", () => {
      google.charts.load("current", { packages: ["corechart"] });

      google.charts.setOnLoadCallback(() => {
        chart = new google.visualization.PieChart(container);

        if (data && options) {
          const dataTable = new google.visualization.DataTable();
          dataTable.addColumn("string", "Topping");
          dataTable.addColumn("number", "Slices");
          dataTable.addRows(data);
          chart.draw(dataTable, options);
        }
      });
    });
    document.head.appendChild(script);

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

    return {
      async update({ table, where, params, context }) {
        const { timeGranularity } = params;

        if (!context.maxTime) return;

        // const data = await sqlQuery(
        //   `SELECT
        //       TIME_FLOOR("__time", '${timeGranularity}') AS "time",
        //       COUNT(*) AS "Count"
        //     FROM ${table}
        //     where ${where
        //       .toString()
        //       .replaceAll("MAX_DATA_TIME()", L(new Date(context.maxTime)))}
        //     GROUP BY 1
        //     ORDER BY 1 ASC
        //     LIMIT 20000`
        // );

        data = [
          ["Mushrooms", 3],
          ["Onions", 1],
          ["Olives", 1],
          ["Zucchini", 1],
          ["Pepperoni", 2],
        ];

        // Set chart options
        options = {
          title: "How Much Pizza I Ate Last Night",
          width: "100%",
          height: "100%",
        };

        if (!chart) return;

        // Create the data table.
        const dataTable = new google.visualization.DataTable();
        dataTable.addColumn("string", "Topping");
        dataTable.addColumn("number", "Slices");
        dataTable.addRows(data);

        // Instantiate and draw our chart, passing in some options.
        chart.draw(dataTable, options);
      },

      async destroy() {
        document.head.removeChild(script);
      },
    };
  },
};

export default {
  component: Thing,
  iconUrl: "http://localhost:3000/swift-square.svg",
  label: "google charts demo",
  moduleName: "dynamic-module-2",
};
