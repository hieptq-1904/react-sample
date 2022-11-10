import {observer} from "mobx-react-lite";
import {useEffect, Suspense, useState} from "react";
import {useGLTF} from "@react-three/drei";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import {ThreeEvent, useFrame, useLoader, useThree} from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { Select } from '@react-three/postprocessing'
import * as THREE from 'three'


const ThreeAction = observer(() => {
    const { scene } = useThree();
    useFrame(({scene}, delta) => {
        console.log(scene)
        // let bigGear = scene.getObjectByName( "BigGear");
        // // console.log(bigGear)
        // if (bigGear) {
        //     bigGear.rotation.x += calculateSpeed(50, delta)
        // }
    });

    const calculateSpeed = (speed: number, delta: number) => {
        return speed * delta * Math.PI / 2 * 0.03;
    };

    return null;
});

export default ThreeAction;
