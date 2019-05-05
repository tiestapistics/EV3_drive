# ev3_drive

MakeCode Library for the LEGO MINDSTORMS EV3.
Allows the EV3 to move along a line or angle using the gyro sensor. The distances can be specified in centimeters through the setup of wheel diameters.

## Usage

Setup for the use of large motors A and B. The gyro sensor is on port 1 and the wheel diameter is 6.2 cm.
```
	Drive.setup(motors.largeAB, sensors.gyro1, 6.2);
```

Accelerate slowly to the final speed of 30. Drive 5 cm straight ahead.
```
	Drive.gyroDrive(5, 0, 0, 30);
```

Drive another 5 cm and then stop (final speed = 0).
```
	let angle: number = 0;
	let speed: number = 0;
	Drive.gyroDrive(5, angle, angle, speed);
```

Drive on to the 90 degree line.
```
	Drive.gyroRotate(90);
```


And now a more complex thing: Start the ride at 10 degrees and drive 15 cm in a curve so that at the end 40 degrees and a speed of 30 are reached. Stop abruptly.
```
	Drive.gyroDrive(15, 10, 40, 30);
	Drive.motorStop();
```

Show current gyro and motor values in EV3 display.
```
forever(function () {
    Drive.info();
    pause(0.5 * 1000);
});

```

More examples can be found in the file **test.ts**.
You can also run the test cases on the EV3. With the keys right / left you can select the test cases and run them with enter.

## TODO

- [ ] Add a reference for your blocks here
- [ ] Add "icon.png" image (300x200) in the root folder
- [ ] Add "- beta" to the GitHub project description if you are still iterating it.
- [ ] Turn on your automated build on https://travis-ci.org
- [ ] Use "pxt bump" to create a tagged release on GitHub
- [ ] Get your package reviewed and approved https://makecode.mindstorms.com/packages/approval

Read more at https://makecode.mindstorms.com/packages/build-your-own

## License

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">ev3_drive</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="http://tiestapistics.de" property="cc:attributionName" rel="cc:attributionURL">tieStAPistics</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.


## Supported targets

* for PXT/ev3
* for PXT/linux

(The metadata above is needed for package search.)

