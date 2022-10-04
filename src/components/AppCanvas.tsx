import {observer} from "mobx-react-lite";
import React, {Suspense, useRef, useEffect, useState} from "react";
import {Canvas, useLoader, useThree} from "@react-three/fiber";
import {Bounds, OrbitControls, GizmoHelper, GizmoViewport, useGLTF} from "@react-three/drei";
import {EffectComposer, Outline, Select, Selection, SMAA, SSAO} from "@react-three/postprocessing";
import Model from "./Model";
import * as THREE from "three";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import html2canvas from "html2canvas";

interface RenderTree {
    id: string;
    name: string;
    children?: readonly RenderTree[];
}
interface CaptureProps {
    capture: boolean;
    setCapture(value: boolean): void;
}

const Capture = ({ ...props}: CaptureProps) => {
    const gl = useThree((state) => state.gl)

    const screenshot = () => {
        const link = document.createElement('a')
        link.setAttribute('download', 'canvas.png')
        link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
        link.click()
    }

    useEffect(() => {
        if (props.capture) {
            screenshot();
            props.setCapture(false);
        }
    }, [props.capture])

    return null
}

function getMeshTree(childArr: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[], configMeshSelect: { [x: string]: boolean; }): RenderTree[] {
    let results = [];
    if (childArr.length) {
        for (let i=0; i<childArr.length; i++) {
            if (childArr[i] instanceof THREE.Mesh) {
                const child = childArr[i] as THREE.Mesh
                configMeshSelect[child.uuid] = false;
                results.push({
                    id: child.uuid,
                    name: child.name
                })
            } else if (childArr[i] instanceof THREE.Object3D || childArr[i] instanceof THREE.Group) {
                configMeshSelect[childArr[i].uuid] = false;
                results.push({
                    id: childArr[i].uuid,
                    name: childArr[i].name,
                    children: getMeshTree(childArr[i].children, configMeshSelect)
                })
            }
        }
    }

    return results
}

function isObjFile(fileLink: string): boolean {
    return fileLink.toLowerCase().split(".").pop() === "obj";
}

function isGltfOrGlbFile(fileLink: string): boolean {
    const extension = fileLink.toLowerCase().split(".").pop()
    return  extension === 'glb' || extension === 'gltf';
}

const AppCanvas = observer(() => {
    const canvasRef = useRef(null);
    // const cameraRef = useRef(null);

    const mainFileLink = 'https://d3bagkewb4pdr3.cloudfront.net/scene.gltf';
    const materialFileLink = '';
    // const mainFileLink = 'https://d3bagkewb4pdr3.cloudfront.net/file/1.obj';
    // const materialFileLink = 'https://d3bagkewb4pdr3.cloudfront.net/file/1.mtl';

    let [configMeshSelect, setConfigMeshSelect] = useState<{ [x: string]: boolean; }>({});
    let [selectedMesh, setSelectedMesh] = useState<string>('')

    let [capture, setCapture] = useState<boolean>(false)

    let objectData: THREE.Object3D|null = null;
    if (isGltfOrGlbFile(mainFileLink)) {
        objectData = useGLTF(mainFileLink).scene
    } else if (isObjFile(mainFileLink)) {
        const materials = useLoader(MTLLoader, materialFileLink);
        objectData = useLoader(OBJLoader, mainFileLink, (loader: any) => {
            materials.preload();
            loader.setMaterials(materials);
        });
    }
    let [meshTreeData, setMeshTreeData] = useState<RenderTree|null>(null)
    let [defaultExpandTree, setDefaultExpandTree] = useState<string[]>([])
    useEffect(() => {
        if (objectData) {
            let cloneObj = Object.assign({}, configMeshSelect)
            cloneObj[objectData.uuid] = false;
            const meshTree = getMeshTree(objectData.children, cloneObj)
            setConfigMeshSelect(cloneObj)
            if (objectData?.children.length) {
                setMeshTreeData({
                    id: objectData.uuid,
                    name: objectData.name ? objectData.name : 'Root',
                    children: meshTree
                })
            } else {
                setMeshTreeData({
                    id: objectData.uuid,
                    name: objectData.name ? objectData.name : 'Root',
                })
            }
        } else {
            setMeshTreeData({
                id: 'root',
                name: 'Root'
            })
        }
    }, [objectData])

    useEffect(() => {
        setDefaultExpandTree(Object.keys(configMeshSelect))
    }, [configMeshSelect])

    const renderTree = (nodes: RenderTree) => (
        <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
            {Array.isArray(nodes.children)
                ? nodes.children.map((node) => renderTree(node))
                : null}
        </TreeItem>
    );

    const onChangeMeshSelect = (event: React.SyntheticEvent, selected:string) => {
        if (selected !== selectedMesh) {
            let cloneObj = Object.assign({}, configMeshSelect);
            if (selectedMesh) {
                cloneObj[selectedMesh] = false
                setConfigMeshSelect({...cloneObj})
            }
            setSelectedMesh(selected)
        }
    }

    const handleClickOnMesh = (e: any, mesh: THREE.Object3D) => {
        if (mesh?.name) {
            e.stopPropagation()
            let meshID = mesh.uuid
            if (meshID !== selectedMesh) {
                if (selectedMesh) {
                    setConfigMeshSelect({...configMeshSelect, [selectedMesh]: false})
                }
                setSelectedMesh(meshID)
            }
        }
    }

    useEffect(() => {
        if (selectedMesh) {
            let cloneObj = Object.assign({}, configMeshSelect);
            cloneObj[selectedMesh] = true
            setConfigMeshSelect({...cloneObj})
        }
    }, [selectedMesh])

    const exportImage = (event: any) => {
        setCapture(true);
    }

    return (
        <div className="app-canvas" style={{position: "relative"}}>
            <div style={{
                position: "fixed",
                backgroundColor: "white",
                left: "0",
                top:"0",
                width: "300px",
                zIndex: "1",
                padding: "20px"
            }}>
                <button onClick={exportImage}>Capture screen</button>
                <br/>
                {meshTreeData && defaultExpandTree.length &&
                    <TreeView
                        aria-label="rich object"
                        defaultCollapseIcon={<ExpandMoreIcon />}
                        defaultExpanded={defaultExpandTree}
                        defaultExpandIcon={<ChevronRightIcon />}
                        sx={{ height: 'auto', maxHeight: "100vh", flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                        onNodeSelect={onChangeMeshSelect}
                        selected={selectedMesh}
                    >
                        {renderTree(meshTreeData)}
                    </TreeView>
                }
            </div>
            <Canvas dpr={[1, 2]} ref={canvasRef} gl={{ preserveDrawingBuffer: true }}>
                <color attach="background" args={['#f5efe6']} />
                <pointLight position={[10, 10, 10]} />
                <ambientLight intensity={0.75} />
                <spotLight angle={1} position={[1.8, 0.8, 1.5]} intensity={0.5} />
                <Selection >
                    <EffectComposer multisampling={0} autoClear={false}>
                        <SSAO radius={0.05} intensity={150} luminanceInfluence={0.5} color="black" />
                        <Outline visibleEdgeColor={0x15C5E8} hiddenEdgeColor={0x15C5E8} blur edgeStrength={100} />
                        <SMAA />
                    </EffectComposer>
                    <Bounds fit clip observe damping={6} margin={2}>
                        <Suspense fallback={null}>
                            {objectData &&
                                <Model
                                    objectData={objectData}
                                    configMeshSelect={configMeshSelect}
                                    selectedMesh={selectedMesh}
                                    handleClickOnMesh={handleClickOnMesh}
                                />
                            }
                        </Suspense>
                    </Bounds>
                </Selection>
                {/*<GizmoHelper alignment="bottom-right">*/}
                {/*    <GizmoViewport axisColors={["hotpink", "aquamarine", "#3498DB"]} labelColor="black" />*/}
                {/*</GizmoHelper>*/}
                <OrbitControls makeDefault />
                <Capture capture={capture} setCapture={setCapture} />
            </Canvas>

        </div>
    );
});

export default AppCanvas;
