/**
 * Motors
 */

class Motor {
    constructor(public name: string, public port: number, public reversed: boolean) {}
}

class MotorGroup {
    constructor(public name: string, public motors: Motor[]) {}
}

/**
 * Sensors
 */

class InertialSensor {
    constructor(public name: string, public port: number) {}
}

class RotationSensor {
    constructor(public name: string, public port: number, public reversed: boolean) {}
}

/**
 * Three-wire sensors
 */

class OpticalShaftEncoder {
    constructor(public name: string, public port1: string, public port2: string, public reversed: boolean) {}
}

/**
 * Other
 */

enum ControllerButton {
    l1,
    l2,
    r1,
    r2,
    up,
    down,
    left,
    right,
    x,
    y,
    a,
    b
}

export {
    Motor,
    MotorGroup,
    InertialSensor,
    RotationSensor,
    OpticalShaftEncoder,

    ControllerButton,
};