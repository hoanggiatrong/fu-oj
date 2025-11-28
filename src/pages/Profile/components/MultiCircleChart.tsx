import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { CheckOutlined } from '@ant-design/icons';

interface ScoreProps {
    solvedEasy: number;
    solvedMedium: number;
    solvedHard: number;
}

const MultiCircleChart: React.FC<{ scores: ScoreProps }> = ({ scores }) => {
    // const total = (scores.solvedEasy || 0) + (scores.solvedMedium || 0) + (scores.solvedHard || 0);
    const total = 3;

    const percentEasy = total ? (scores.solvedEasy + 1 / total) * 100 : 0;
    const percentMedium = total ? (scores.solvedMedium + 1 / total) * 100 : 0;
    const percentHard = total ? (scores.solvedHard + 1 / total) * 100 : 0;

    return (
        <div className="statistic">
            <div className="chart" style={{ position: 'relative', width: 150, height: 150 }}>
                {/* Easy */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <CircularProgressbar
                        value={percentEasy}
                        strokeWidth={5}
                        styles={buildStyles({
                            pathColor: '#00cfff',
                            trailColor: '#1a1a1a'
                        })}
                    />
                </div>

                {/* Medium */}
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 'calc(100% - 20px)',
                        height: 'calc(100% - 20px)'
                    }}
                >
                    <CircularProgressbar
                        value={percentMedium}
                        strokeWidth={5}
                        styles={buildStyles({
                            pathColor: '#FFD700',
                            trailColor: 'transparent'
                        })}
                    />
                </div>

                {/* Hard */}
                <div
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        width: 'calc(100% - 40px)',
                        height: 'calc(100% - 40px)'
                    }}
                >
                    <CircularProgressbar
                        value={percentHard}
                        strokeWidth={5}
                        styles={buildStyles({
                            pathColor: '#ff4d4f',
                            trailColor: 'transparent'
                        })}
                    />
                </div>

                <div className="chart-center">
                    <div className="solved">
                        <b>{scores.solvedEasy + scores.solvedMedium + scores.solvedHard}</b> / <div>{total}</div>
                    </div>
                    <div className="label">
                        <CheckOutlined className="ico" />
                        Solved
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiCircleChart;
