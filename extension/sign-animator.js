import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import * as alphabets from './assets/animations/alphabets.js';
import { defaultPose } from './assets/animations/defaultPose.js';

export class SignAnimator {
    constructor(containerId, onTextUpdate = null) {
        this.containerId = containerId;
        this.onTextUpdate = onTextUpdate;
        this.ref = {
            flag: false,
            pending: false,
            animations: [], // Queue of animations: Each item is an array of [boneMoves...] OR ['add-text', text]
            characters: [],
            scene: null,
            camera: null,
            renderer: null,
            avatar: null,
            animate: null
        };
        this.paused = false;
        this.isInitialized = false;
        this.resolveQueue = [];
    }

    async init() {
        if (this.isInitialized) return;

        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('SignAnimator: Container not found');
            return;
        }

        // Setup Scene
        this.ref.scene = new THREE.Scene();
        this.ref.scene.background = null;

        // Setup Light
        const spotLight = new THREE.SpotLight(0xffffff, 2);
        spotLight.position.set(0, 5, 5);
        this.ref.scene.add(spotLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.ref.scene.add(ambientLight);

        // Setup Renderer
        this.ref.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        const { clientWidth, clientHeight } = container;
        this.ref.renderer.setSize(clientWidth, clientHeight);

        // Setup Camera
        this.ref.camera = new THREE.PerspectiveCamera(
            30,
            clientWidth / clientHeight,
            0.1,
            1000
        );
        this.ref.camera.position.z = 1.6;
        this.ref.camera.position.y = 1.4;

        container.innerHTML = '';
        container.appendChild(this.ref.renderer.domElement);

        // Start animation loop immediately so ref.animate is defined for defaultPose
        this.startAnimationLoop();

        try {
            await this.loadModel();
            this.isInitialized = true;
            console.log('SignAnimator: Initialized');
        } catch (error) {
            console.error('SignAnimator: Failed to load model', error);
        }

        // handleResize ... (rest same)
        this.handleResize = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            this.ref.renderer.setSize(width, height);
            this.ref.camera.aspect = width / height;
            this.ref.camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', this.handleResize);
    }


    loadModel() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            const modelUrl = chrome.runtime.getURL('assets/models/ybot.glb');

            loader.load(
                modelUrl,
                (gltf) => {
                    gltf.scene.traverse((child) => {
                        if (child.type === 'SkinnedMesh') {
                            child.frustumCulled = false;
                        }
                    });
                    this.ref.avatar = gltf.scene;
                    this.ref.scene.add(this.ref.avatar);
                    defaultPose(this.ref);
                    resolve();
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }

    startAnimationLoop() {
        const speed = 0.1;
        const pause = 800;

        this.ref.animate = () => {
            if (this.paused) return;

            requestAnimationFrame(this.ref.animate);

            if (this.ref.animations.length === 0) {
                this.ref.pending = false;
                // If we had a promise waiting for completion, resolve it now
                if (this.currentResolve) {
                    this.currentResolve();
                    this.currentResolve = null;
                }
                return;
            }

            if (this.ref.animations[0].length) {
                if (!this.ref.flag) {
                    // Check for specialized commands
                    if (this.ref.animations[0][0] === 'add-text') {
                        const text = this.ref.animations[0][1];
                        if (this.onTextUpdate) {
                            this.onTextUpdate(text);
                        }
                        this.ref.animations.shift();
                    } else if (this.ref.avatar) {
                        // Standard Bone Animation
                        for (let i = 0; i < this.ref.animations[0].length;) {
                            let [boneName, action, axis, limit, sign] = this.ref.animations[0][i];
                            let bone = this.ref.avatar.getObjectByName(boneName);

                            if (!bone) { i++; continue; }

                            if (sign === "+" && bone[action][axis] < limit) {
                                bone[action][axis] += speed;
                                bone[action][axis] = Math.min(bone[action][axis], limit);
                                i++;
                            } else if (sign === "-" && bone[action][axis] > limit) {
                                bone[action][axis] -= speed;
                                bone[action][axis] = Math.max(bone[action][axis], limit);
                                i++;
                            } else {
                                this.ref.animations[0].splice(i, 1);
                            }
                        }
                    }
                }
            } else {
                this.ref.flag = true;
                setTimeout(() => {
                    this.ref.flag = false;
                }, pause);
                this.ref.animations.shift();
            }
            this.ref.renderer.render(this.ref.scene, this.ref.camera);
        };

        this.ref.animate();
    }

    playWord(word) {
        return new Promise((resolve) => {
            if (!this.isInitialized || !word) {
                resolve();
                return;
            }

            this.currentResolve = resolve;
            console.log(`SignAnimator: Playing word "${word}"`);

            try {
                const upperWord = word.toUpperCase();

                // Check if we have a full-word animation
                if (alphabets[upperWord]) {
                    console.log(`SignAnimator: Found full animation for "${upperWord}"`);
                    this.ref.animations.push(['add-text', upperWord]);
                    alphabets[upperWord](this.ref);
                } else {
                    // Spell it out
                    for (const [index, ch] of upperWord.split('').entries()) {
                        const isLast = index === upperWord.length - 1;
                        this.ref.animations.push(['add-text', ch]);
                        if (alphabets[ch]) {
                            alphabets[ch](this.ref);
                        } else {
                            console.warn(`SignAnimator: No animation for char ${ch}`);
                        }
                    }
                }

                // Ensure loop is running
                if (this.ref.pending === false) {
                    this.ref.pending = true;
                    this.ref.animate();
                }
            } catch (error) {
                console.error("SignAnimator: Error playing word", error);
                // Force resolve so we don't hang
                if (this.currentResolve) {
                    this.currentResolve();
                    this.currentResolve = null;
                }
            }
        });
    }


    clear() {
        this.ref.animations = [];
        this.ref.pending = false;

        // Reset to default pose if avatar exists
        if (this.ref.avatar) {
            defaultPose(this.ref);
        }

        if (this.onTextUpdate) this.onTextUpdate('');

        if (this.currentResolve) {
            this.currentResolve();
            this.currentResolve = null;
        }
    }

    dispose() {
        this.clear();
        if (this.ref.renderer) {
            this.ref.renderer.dispose();
        }
        // Dispose scene objects if needed, but usually renderer.dispose() is main one for context
    }
}
