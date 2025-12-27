
import * as monaco from 'monaco-editor';

const PYSPARK_FUNCTIONS = [
  'col', 'lit', 'when', 'otherwise', 'concat', 'substring', 'datediff', 'date_add', 'date_sub',
  'count', 'sum', 'avg', 'max', 'min', 'first', 'last', 'countDistinct', 'collect_list', 'collect_set',
  'struct', 'array', 'explode', 'filter', 'exists', 'transform', 'aggregate', 'split', 'lower', 'upper',
  'regexp_extract', 'regexp_replace', 'to_date', 'to_timestamp', 'year', 'month', 'dayofmonth', 'hour'
];

const DATAFRAME_METHODS = [
  'select', 'filter', 'where', 'groupBy', 'agg', 'withColumn', 'withColumnRenamed', 'drop', 'join',
  'union', 'unionByName', 'distinct', 'dropDuplicates', 'sort', 'orderBy', 'limit', 'alias',
  'show', 'printSchema', 'collect', 'count', 'first', 'head', 'take', 'describe', 'summary'
];

const SNIPPETS = [
  {
    label: 'spark-session',
    documentation: 'Initialize a standard Spark Session',
    insertText: 'spark = SparkSession.builder.appName("${1:App}").getOrCreate()'
  },
  {
    label: 'read-csv',
    documentation: 'Read a CSV file into a DataFrame',
    insertText: 'df = spark.read.csv("${1:path}", header=True, inferSchema=True)'
  },
  {
    label: 'agg-count',
    documentation: 'Common aggregation: count distinct',
    insertText: 'agg(countDistinct("${1:column}").alias("${2:count}"))'
  }
];

let isInitialized = false;

export const setupMonacoPySpark = () => {
  if (isInitialized) return;
  isInitialized = true;

  // 使用 CDN 加载 Worker 脚本，确保在 Vite 环境下稳定运行
  // @ts-ignore
  self.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: any, label: string) {
      const baseUrl = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
      if (label === 'json') return `${baseUrl}/language/json/json.worker.js`;
      if (label === 'css' || label === 'scss' || label === 'less') return `${baseUrl}/language/css/css.worker.js`;
      if (label === 'html' || label === 'handlebars' || label === 'razor') return `${baseUrl}/language/html/html.worker.js`;
      if (label === 'typescript' || label === 'javascript') return `${baseUrl}/language/typescript/ts.worker.js`;
      return `${baseUrl}/editor/editor.worker.js`;
    }
  };

  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [
        ...PYSPARK_FUNCTIONS.map(f => ({
          label: f,
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: `PySpark SQL Function: ${f}`,
          insertText: f,
          range
        })),
        ...DATAFRAME_METHODS.map(m => ({
          label: m,
          kind: monaco.languages.CompletionItemKind.Method,
          documentation: `DataFrame Method: ${m}`,
          insertText: m,
          range
        })),
        ...SNIPPETS.map(s => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: s.documentation,
          insertText: s.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        }))
      ];

      return { suggestions };
    }
  });
};
