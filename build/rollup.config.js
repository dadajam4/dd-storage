import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';

export default ({ format }) => {
  // const isES = format === 'es';
  const isIIFE = format === 'iife';
  // const external = isES ? ['dd-event'] : [];
  // const nodeResolveTargets = ['bezier-easing'];
  // if (!isES) nodeResolveTargets.push('dd-event');

  const plugins = [
    typescript(),
    nodeResolve({
      // only: nodeResolveTargets,
    }),
    commonjs({
      include: 'node_modules/**',
    }),
  ];
  if (isIIFE) {
    plugins.push(uglify());
  }

  return {
    input: 'src/index.ts',
    // external,
    output: {
      name: 'DDStorage',
      exports: 'named', // default
      // exports: 'default', // named
    },
    plugins,
  };
};
