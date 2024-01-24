// webpack.config.js

const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif|svg|webp)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'public/',
                        },
                    },
                ],
            },
        ],
    },
};
