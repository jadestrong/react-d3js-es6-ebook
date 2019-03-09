import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Ball = ({x, y}) => <circle cx={x} cy={y} r="5" />;

const MAX_H = 750;

const App = () => {
    const [y, setY] = useState(5);
    const [vy, setVy] = useState(0);
    const [lastFrame, setLastFrame] = useState();

    const gameLoop = () => {
        let temp = vy;

        if (y > MAX_H) {
            temp = -temp * 0.87;
        }

        let frames = 1;

        if (lastFrame) {
            frames = (d3.now() - lastFrame) / (1000 / 60);
        }

        setY(prev => prev + temp * frames);
        setVy(temp + 0.3 * frames);
        setLastFrame(d3.now());
    };

    useInterval(gameLoop);

    return (
        <svg with="100%" height={MAX_H}>
          <Ball x={50} y={y} />
        </svg>
    );
};

function useInterval(callback) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        const timer = d3.timer(tick);
        return timer.stop;
    }, []);
}

export default App;
