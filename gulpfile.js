const gulp = require('gulp');
const webpack = require('webpack-stream');

function buildHTML() {
  return gulp
    .src('src/index.html')
    .pipe(gulp.dest('dist/'));
}

function buildCode() {
  return gulp
  .src('src/main.ts')
  .pipe(
    webpack({
      mode: 'development',
      devtool: 'eval-source-map',
      module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            use: {
              loader: 'ts-loader'
            }
          },
          {
            test: /\.(glsl)$/,
            use: {
              loader: 'raw-loader'
            }
          }
        ]
      },
      resolve: {
        extensions: ['.ts'],
      },
      // Any configuration options...
    })
  )
  .pipe(gulp.dest('dist/'));
}

gulp.task('build', gulp.parallel([buildHTML, buildCode]));

gulp.task('build:watch', () => gulp.watch(['src/**/*.ts', 'src/**/*.glsl'], gulp.parallel([buildHTML, buildCode])));

// gulp.task('default', 'build']);

// const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { DefinePlugin } = require('webpack');
// const { createTransformer } = require('./src/binaryts/dist/transformer');

// const config = {
//   entry: {
//     main: path.resolve(__dirname, 'src', 'index.ts'),
//   },
//   output: {
//     path: path.resolve(__dirname, 'dist'),
//     filename: '[name].js',
//   },
//   devServer: {
//     hot: false,
//     hotOnly: true,
//     contentBase: './dist',
//     historyApiFallback: {
//       rewrites: [
//         { from: '/', to: '/index.html' },
//       ]
//     }
//   },
//   plugins: [
//     new HtmlWebpackPlugin({
//       inject: false,
//       hash: false,
//       minify: false,
//       template: './src/index.html',
//       filename: 'index.html',
//     }),
//   ],
//   module: {
//     rules: [
//       {
//         test: /(\.ts?$|\.tsx?$)/,
//         exclude: /(node_modules|bower_components)/,
//         use: [
//           {
//             loader: 'babel-loader',
//             options: {
//               presets: ['@babel/preset-env'],
//               plugins: [
//                 '@babel/plugin-transform-runtime'
//               ],
//             }
//           },
//           {
//             loader: 'ts-loader',
//             options: {
//               getCustomTransformers: (program) => ({
//                   before: [createTransformer(program)]
//               })
//             }
//           }
//         ],
//       },
//       {
//         test: /\.vert$/i,
//         use: 'raw-loader',
//       },
//       {
//         test: /\.frag$/i,
//         use: 'raw-loader',
//       },
//       {
//         test: /\.wasm$/i,
//         use: 'file-loader',
//       },
//     ]
//   },
//   optimization: {
//     splitChunks: {
//         cacheGroups: {
//           vendor: {
//                 test: /node_modules/,
//                 name: 'vendor',
//                 chunks: 'initial',
//                 enforce: true
//             }
//         }
//     },
//   },
//   resolve: {
//     alias: {
//       'ir': path.resolve(__dirname, 'src', 'ir'),
//       'interpreter': path.resolve(__dirname, 'src', 'interpreter'),
//       'compiler': path.resolve(__dirname, 'src', 'compiler'),
//       "text-generation": path.resolve(__dirname, 'src', 'text-generation'),
//       "components": path.resolve(__dirname, 'src', 'components'),
//       "consts": path.resolve(__dirname, 'src', 'consts'),
//       "types": path.resolve(__dirname, 'src', 'types'),
//       "utils": path.resolve(__dirname, 'src', 'utils'),
//     },
//     extensions: ['.js', '.jsx', '.ts', '.tsx']
//   }
// };

// module.exports = (env, argv) => {
//   if (argv.mode === 'production') {
//     config.mode = 'production';
//     config.devtool = undefined;
//     config.plugins.push(
//       new DefinePlugin({
//         __DEV__: false
//       })
//     );
//   } else {
//     config.mode = 'development';
//     config.devtool = 'eval-source-map';
//     config.plugins.push(
//       new DefinePlugin({
//         __DEV__: true
//       })
//     );
//   }

//   return [config];
// };

