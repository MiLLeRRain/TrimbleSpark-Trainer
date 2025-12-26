
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

  // Set up loader for workers
  // @ts-ignore
  self.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: any, label: string) {
      if (label === 'json') return 'https://esm.sh/monaco-editor@0.52.2/esm/vs/language/json/json.worker?worker';
      if (label === 'css' || label === 'scss' || label === 'less') return 'https://esm.sh/monaco-editor@0.52.2/esm/vs/language/css/css.worker?worker';
      if (label === 'html' || label === 'handlebars' || label === 'razor') return 'https://esm.sh/monaco-editor@0.52.2/esm/vs/language/html/html.worker?worker';
      if (label === 'typescript' || label === 'javascript') return 'https://esm.sh/monaco-editor@0.52.2/esm/vs/language/typescript/ts.worker?worker';
      return 'https://esm.sh/monaco-editor@0.52.2/esm/vs/editor/editor.worker?worker';
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
        // PySpark Functions (triggered after F.)
        ...PYSPARK_FUNCTIONS.map(f => ({
          label: f,
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: `PySpark SQL Function: ${f}`,
          insertText: f,
          range
        })),
        // DataFrame Methods (triggered after .)
        ...DATAFRAME_METHODS.map(m => ({
          label: m,
          kind: monaco.languages.CompletionItemKind.Method,
          documentation: `DataFrame Method: ${m}`,
          insertText: m,
          range
        })),
        // Snippets
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
