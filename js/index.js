var INTERSECTED;
const vechicleColors = [0xa52523, 0xbdb638, 0x78b14b];
const zoom = 2;
const carFrontTexture = new Texture(40,80,[{x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40,80,[{x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110,40,[{x: 10, y: 0, w: 50, h: 30 }, {x: 70, y: 0, w: 30, h: 30 }]);
const carLeftSideTexture = new Texture(110,40,[{x: 10, y: 10, w: 50, h: 30 }, {x: 70, y: 10, w: 30, h: 30 }]);

function Texture(width, height, rects) {
    const canvas = document.createElement( "canvas" );
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext( "2d" );
    context.fillStyle = "#ffffff";
    context.fillRect( 0, 0, width, height );
    context.fillStyle = "rgba(0,0,0,0.6)";  
    rects.forEach(rect => {
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
    });
    return new THREE.CanvasTexture(canvas);
}

function Wheel() {
    const wheel = new THREE.Mesh( 
      new THREE.BoxBufferGeometry( 12*zoom, 33*zoom, 12*zoom ), 
      new THREE.MeshLambertMaterial( { color: 0x333333, flatShading: true } ) 
    );
    wheel.position.z = 6*zoom;
    return wheel;
}

function Car() {
    const car = new THREE.Group();
    const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];
    
    const main = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 60*zoom, 30*zoom, 15*zoom ), 
      new THREE.MeshPhongMaterial( { color, flatShading: true } )
    );
    main.position.z = 12*zoom;
    main.castShadow = true;
    main.receiveShadow = true;
    car.add(main)
    
    const cabin = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 33*zoom, 24*zoom, 12*zoom ), 
      [
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carBackTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carFrontTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carRightSideTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carLeftSideTexture } ),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ), // top
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ) // bottom
      ]
    );
    cabin.position.x = 6*zoom;
    cabin.position.z = 25.5*zoom;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    car.add( cabin );
    
    const frontWheel = new Wheel();
    frontWheel.position.x = -18*zoom;
    car.add( frontWheel );
  
    const backWheel = new Wheel();
    backWheel.position.x = 18*zoom;
    car.add( backWheel );
  
    car.castShadow = true;
    car.receiveShadow = false;
    
    return car;  
  }

var main = {
    init: function(){
        this.renderer = new THREE.WebGLRenderer({
            canvas:document.getElementById("renderCanvas"),
            antialias: true,
            alpha: true
        });
        //创建渲染器
        this.renderer.setClearColor(0x333333);
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        //添加canvas
        // this.canvas = this.renderer.domElement;
        // document.body.appendChild(this.canvas);
        //创建场景        
        this.scene  = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        // 二维坐标用来转化鼠标参数
        this.mouse = new THREE.Vector2();

        this.raycaster = new THREE.Raycaster();
        this.clock = new THREE.Clock();
        //事件监听
        //document.addEventListener('mousemove', this.onDocumentMouseMove, false);
        //window.addEventListener('resize', this.onWindowResize, false);
        this.buildLightSystem();//添加光源线
        this.buildAuxSystem();//添加坐标系统
        this.addGround();
        this.vechicle=this.loadCar();
        this.animation();
    },
    //添加Oimo物理引擎
    initOimoPhysics:function(){

    },
     //添加Cannon物理引擎
    initCannonPhysics:function(){

    },
    loadControls:function(){
        //创建场景Controls
        var controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
        controls.screenSpacePanning = true;
        controls.enableDamping = true
        controls.dampingFactor = 0.25
        controls.rotateSpeed = 0.35
    },
    loadCar:function(){
        const vechicle = new Car();
        vechicle.rotateX(-Math.PI/2);
        this.scene.add(vechicle);
        return vechicle;
    },
    buildLightSystem:function(){
        /*
        AmbientLight: 环境光，基础光源，它的颜色会被加载到整个场景和所有对象的当前颜色上。
        PointLight：点光源，朝着所有方向都发射光线
        SpotLight ：聚光灯光源：类型台灯，天花板上的吊灯，手电筒等
        DirectionalLight：方向光，又称无限光，从这个发出的光源可以看做是平行光.
        */
        // 初始化相机配置
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(300, 300, 300);
        this.camera.lookAt(this.scene.position);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
        directionalLight.position.set(300, 1000, 500);
        directionalLight.target.position.set(0, 0, 0);
        directionalLight.castShadow = true;

        var d = 300;
        directionalLight.shadow.camera = new THREE.OrthographicCamera(-d, d, d, -d, 500, 1600);
        directionalLight.shadow.bias = 0.0001;
        directionalLight.shadow.mapSize.width = directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight)

        var light = new THREE.AmbientLight(0xffffff, 0.6);
        this.LightHelper = new THREE.DirectionalLightHelper(directionalLight);
        this.scene.add(this.LightHelper);
        this.scene.add(light)
        this.loadControls()
      
    },
    animation:function(){
        //this.LightHelper.update(); 
        requestAnimationFrame(this.animation.bind(this));
        this.vechicle.position.x -=1;
        //this.render();
        this.renderer.render(this.scene, this.camera);
    },
    render:function(){
        // 鼠标位置向摄像机位置发射一条射线
        main.raycaster.setFromCamera(main.mouse,main.camera);
        // 设置射线影响的范围
        var intersects = main.raycaster.intersectObjects(main.mall.children);
        if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex(0xff0000);
        }
        } else {
        if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
        }
        main.renderer.render(main.scene, main.camera);
    },
    // 构建平地
    addGround: function(){
        var shape = new THREE.CubeGeometry(6000, 10, 6000);
        var material = new THREE.MeshLambertMaterial({
            color: 0x779966,
            emissive: 0x333333,
        });
        ground = new THREE.Mesh(shape, material);
        ground.receiveShadow = true;
        //THREE.Vector3有x、y、z三个属性
        ground.position.set(0,-6, 0);
        ground.receiveShadow=true;
        this.scene.add(ground);
        this.ground=ground;
    },
    //辅助系统: 网格和坐标
    buildAuxSystem:function(){
        var axisHelper = new THREE.AxesHelper(2000)
        this.scene.add(axisHelper);
        var width=6000;
        var split=60;
        var gridHelperx = new THREE.GridHelper(width,split)//长宽600等分60格1格等于10
        var gridHelpery = new THREE.GridHelper(width,split)
        var gridHelperz = new THREE.GridHelper(width,split)
        gridHelperx.rotateX(-Math.PI / 2);
        gridHelperz.rotateZ(Math.PI / 2);
        this.scene.add(gridHelperx);
        this.scene.add(gridHelpery);
        this.scene.add(gridHelperz);
    }
};

main.init();
