import Payload, { Pid, Autonomous, Action, SetPoseAction, TurnToAction, MoveToAction, WaitAction, RunAction, FollowAction } from './payload';
import * as types from './types';

export default class CodeGenerator {


    constructor(public payload: Payload) {
        console.log("Payload: " + JSON.stringify(payload));
    }

    public generateMotorGroup(group: types.MotorGroup): string {
        let generated: string = '';

        for (const motor of group.motors) {
            generated += `pros::Motor ${motor.name}(${motor.port}${motor.reversed ? ', true' : ''});\n`;
        }

        generated += `pros::MotorGroup ${group.name}({${group.motors.map(motor => motor.name).join(', ')}});\n`;

        return generated;
    }

    public generatePid(name: string, pid: Pid): string {
        let generated: string = '';

        const tab = '    ';

        generated += `lemlib::ChassisController_t ${name}Controller {\n${tab}${pid.kP},\n${tab}${pid.kD},\n${tab}${pid.smallErrorRange},\n${tab}${pid.smallErrorTimeout},\n${tab}${pid.largeErrorRange},\n${tab}${pid.largeErrorTimeout}\n};\n`;
    
        return generated;
    }

    public generateAutonomous(auton: Autonomous): string {
        let generated: string = '';

        const tab = '    ';

        generated += `void ${auton.name}() {\n`; // method declaration
        
        for (const action of auton.actions) {
            switch (action.type) {
                case 'setPose':
                    const setPoseAction = action.args as SetPoseAction;

                    generated += `${tab}chassis.setPose(${setPoseAction.x}, ${setPoseAction.y}, ${setPoseAction.heading});\n`;

                    break;
                case 'turnTo':
                    const turnToAction = action.args as TurnToAction;

                    generated += `${tab}chassis.turnTo(${turnToAction.x}, ${turnToAction.y}}, ${turnToAction.timeout}, ${turnToAction.backFacing ? 'true' : 'false'}, ${turnToAction.maximumSpeed});\n`;
            
                    break;
                case 'moveTo':
                    const moveToAction = action.args as MoveToAction;

                    generated += `${tab}chassis.moveTo(${moveToAction.x}, ${moveToAction.y}}, ${moveToAction.timeout}, ${moveToAction.maximumSpeed});\n`;

                    break;
                case 'wait':
                    const waitAction = action.args as WaitAction;

                    generated += `${tab}pros::delay(${waitAction.timeout});\n`;

                    break;
                case 'run':
                    const runAction = action.args as RunAction;

                    generated += `${tab}${runAction.motorName}.move_velocity(${runAction.velocity}, ${runAction.timeout});\n`;

                    break;
                case 'follow':
                    const followAction = action.args as FollowAction;

                    generated += `${tab}chassis.followPath("${followAction.path}");\n`;

                    break;
            }
        }

        generated += '}\n';

        return generated;
    }

    public generate(): string {
        let generated: string = '';

        const tab = '    ';

        // include statements
        generated += `#include "${this.payload.code.header}"\n#include "lemlib/api.hpp"\n\n`;

        // motor setup
        this.payload.setup.motors.forEach(motor => {
            generated += `pros::Motor ${motor.name}(${motor.port}${motor.reversed ? ', true' : ''});\n`;
        });

        generated += '\n';

        generated += this.generateMotorGroup(this.payload.setup.chassis.leftMotors) + '\n';
        generated += this.generateMotorGroup(this.payload.setup.chassis.rightMotors) + '\n';

        // chassis
        // sensors
        const trackingWheelClass: string = this.payload.setup.chassis.odometry.uses === 'rotation' ? 'pros::Rotation' : 'pros::ADIEncoder';

        let horizontalTrackingWheels = 0;
        let verticalTrackingWheels = 0;

        for (const trackingWheel of this.payload.setup.chassis.odometry.trackingWheels) {
            generated += trackingWheelClass + ' ' + trackingWheel.sensor.name;
            if (this.payload.setup.chassis.odometry.uses === 'optical_shaft_encoder') {
                const sensor = trackingWheel.sensor as types.OpticalShaftEncoder;

                generated += `(${sensor.port1}, ${sensor.port2}, ${trackingWheel.sensor.reversed ? 'true' : 'false'});\n`;
            } else {
                const sensor = trackingWheel.sensor as types.RotationSensor;

                generated += `(${sensor.port}, ${trackingWheel.sensor.reversed ? 'true' : 'false'});\n`;
            }

            if (trackingWheel.type === 'horizontal') horizontalTrackingWheels++;
            else verticalTrackingWheels++;
        }

        if (this.payload.setup.chassis.odometry.inertial !== null) generated += `\npros::Imu inertial_sensor(${this.payload.setup.chassis.odometry.inertial.port});\n\n`;
        else generated += '\n';

        // tracking wheels

        let horizontalOccurences = 0;
        let verticalOccurences = 0;

        for (const trackingWheel of this.payload.setup.chassis.odometry.trackingWheels) {
            generated += `lemlib::TrackingWheel ` + trackingWheel.type + (trackingWheel.type === 'horizontal' ? horizontalOccurences + 1 : verticalOccurences + 1) + `(&${trackingWheel.sensor.name}, ${trackingWheel.wheelDiameter}, ${trackingWheel.trackingCenterOffset});\n`;
        
            if (trackingWheel.type === 'horizontal') horizontalOccurences++;
            else verticalOccurences++;
        }

        generated += '\n';

        // odometry

        generated += `lemlib::OdomSensors_t sensors = {\n${tab}${horizontalOccurences > 0 ? '&horizontal1' : 'nullptr'},\n${tab}${horizontalOccurences > 1 ? '&horizontal2' : 'nullptr'},\n${tab}${verticalOccurences > 0 ? '&vertical1' : 'nullptr'},\n${tab}${verticalOccurences > 1 ? '&vertical2' : 'nullptr'},\n${tab}${this.payload.setup.chassis.odometry.inertial !== null ? '&inertial_sensor' : 'nullptr'}\n};\n\n`;

        // pids

        generated += this.generatePid('lateral', this.payload.setup.chassis.pid.lateral) + '\n';
        generated += this.generatePid('angular', this.payload.setup.chassis.pid.angular) + '\n';

        // chassis
        
        generated += `lemlib::Chassis chassis(&leftMotors, &rightMotors, ${this.payload.setup.chassis.trackWidth}, lateralController, angularController, sensors);\n\n`;

        // init

        generated += 'void initialize() {\n';
        generated += `${tab}chassis.calibrate();\n`;
        generated += `${tab}chassis.setPose(0, 0, 0);\n`;
        generated += '}\n\n';

        // autonomous

        for (const auton of this.payload.autonomous) {
            generated += this.generateAutonomous(auton);
        }

        generated += '\n';

        generated += 'void autonomous() {\n';
        generated += `${tab}int selectedAuton = 0; // TODO: implement auton selector\n\n`;
        generated += `${tab}switch (selectedAuton) {\n`;
        
        let a = 0;

        for (const auton of this.payload.autonomous) {
            generated += `${tab}${tab}case ${a}:\n`;
            generated += `${tab}${tab}${tab}${auton.name}();\n`;
            generated += `${tab}${tab}${tab}break;\n\n`;

            a++;
        }

        generated += `${tab}}\n`;

        generated += '}\n\n';

        // opcontrol

        generated += 'void opcontrol() {\n';
        generated += `${tab}pros::Controller master(pros::E_CONTROLLER_MASTER);\n\n`;
        generated += `${tab}while (true) {\n`;
        generated += `${tab}${tab}leftMotors.move_velocity(${this.payload.opcontrol.controller.invert ? '-' : ''}((master.get_analog(pros::E_CONTROLLER_ANALOG_LEFT_Y) * 2) * ${this.payload.opcontrol.controller.sensitivity}));\n`;
        generated += `${tab}${tab}rightMotors.move_velocity(${this.payload.opcontrol.controller.invert ? '-' : ''}((master.get_analog(pros::E_CONTROLLER_ANALOG_RIGHT_Y) * 2) * ${this.payload.opcontrol.controller.sensitivity}));\n\n`;
        
        // TODO: implement opcontrol mappings

        generated += `${tab}${tab}pros::delay(10);\n`;
        generated += `${tab}}\n`;
        generated += '}\n';

        return generated;
    }

    public saveTo(path: string) {
        const fs = require('fs');

        fs.writeFileSync(path, this.generate());

        console.log('Saved to: ' + path);
    }

}