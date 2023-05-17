import * as dygraphs from "https://cdnjs.cloudflare.com/ajax/libs/dygraph/2.2.1/dygraph.min.js";
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
    let g;

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

        const data = await sqlQuery(
          `SELECT
              TIME_FLOOR("__time", '${timeGranularity}') AS "time",
              COUNT(*) AS "Count"
            FROM ${table}
            where ${where
              .toString()
              .replaceAll("MAX_DATA_TIME()", L(new Date(context.maxTime)))}
            GROUP BY 1
            ORDER BY 1 ASC
            LIMIT 20000`
        );

        if (!data) return;

        if (!g) {
          g = new Dygraph(container, data.rows, {
            labels: ["x", "Count"],
          });
        } else {
          g.updateOptions({
            file: data.rows,
          });
        }
      },

      async destroy() {
        if (g) {
          g.destroy();
          g = undefined;
        }
      },
    };
  },
};

export default {
  component: Thing,
  iconUrl: "http://localhost:3000/swift-square.svg",
  label: "dyGraphs demo",
  moduleName: "dynamic-module-0",
};
