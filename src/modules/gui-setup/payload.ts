import * as types from "./types";

type Pid = {
    kP: number;
    kD: number;
    smallErrorRange: number;
    smallErrorTimeout: number;
    largeErrorRange: number;
    largeErrorTimeout: number;
};

type SetPoseAction = {
    x: number;
    y: number;
    heading: number;
};

type TurnToAction = {
    x: number;
    y: number;
    timeout: number;
    backFacing: boolean; // default false
    maximumSpeed: number; // default 200
};

type MoveToAction = {
    x: number;
    y: number;
    timeout: number;
    maximumSpeed: number; // default 200
};

type WaitAction = {
    timeout: number;
};

type RunAction = {
    motorName: string;
    velocity: number;
    timeout: number;
};

type FollowAction = {
    path: string;
};

type Action = {
    type: 'setPose' | 'turnTo' | 'moveTo' | 'wait' | 'run' | 'follow';
    args: SetPoseAction | TurnToAction | MoveToAction | WaitAction | RunAction | FollowAction;
};

type Autonomous = {
    name: string;
    actions: Action[];
};

type Payload = {
    code: {
        header: string; // should be "main.h"
    },
    setup: {
        motors: types.Motor[];
        chassis: {
            type: 'differential'; // only supported type for now. future: mecanum, x-drive

            leftMotors: types.MotorGroup;
            rightMotors: types.MotorGroup;

            odometry: {
                uses: 'rotation' | 'optical_shaft_encoder';
                trackingWheels: {
                    type: 'horizontal' | 'vertical';
                    sensor: types.RotationSensor | types.OpticalShaftEncoder;
                    wheelDiameter: 2.75 | 3.25 | 4; // inches
                    trackingCenterOffset: number; // inches
                }[];
                inertial: types.InertialSensor | null;
            },
            
            pid: {
                lateral: Pid;
                angular: Pid;
            }

            trackWidth: number; // inches
        }
    },
    autonomous: Autonomous[];
    opcontrol: {
        controller: {
            invert: boolean;
            sensitivity: number; // (multiplies the joystick values, 0.5 for half, 1 for normal, 2 for double, etc.)
            deadzone: number; // (joystick values below this are ignored)

            mappings:{
                button: types.ControllerButton;
                action: 'revolve' | 'toggle';
                motors: string[];
                velocity: number; // rpm
            }[];
        }
    }
};

export default Payload;
export { Pid, Autonomous, Action, SetPoseAction, TurnToAction, MoveToAction, WaitAction, RunAction, FollowAction };