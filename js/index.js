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
  function basicTexture(n){
    var canvas = document.createElement( 'canvas' );
    canvas.width = canvas.height = 64;
    var ctx = canvas.getContext( '2d' );
    var color;
    if(n===0) color = "#3884AA";// sphere58AA80
    if(n===1) color = "#61686B";// sphere sleep
    if(n===2) color = "#AA6538";// box
    if(n===3) color = "#61686B";// box sleep
    if(n===4) color = "#AAAA38";// cyl
    if(n===5) color = "#61686B";// cyl sleep
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);

    var tx = new THREE.Texture(canvas);
    tx.needsUpdate = true;
    return tx;
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
        //this.addGround();
        //this.vechicle=this.loadCar();
        this.initOimoPhysics();
        this.animation();
        
    },
    animation:function(){
        this.updateOimoPhysics();
        requestAnimationFrame(this.animation.bind(this));
        //this.vechicle.position.x -=1;
        this.renderer.render(this.scene, this.camera);
    },
    //添加Oimo物理引擎
    initOimoPhysics:function(){
       //创建物理世界
    //     this.world = new OIMO.World({ 
    //     timestep: 1/60, //物理世界的刷新频率，通常为60帧每秒
    //     iterations: 8, 
    //     broadphase: 2, // 碰撞检测算法类型，2号算法比较稳定
    //     worldscale: 1, // 物理世界的缩放 
    //     random: true,  // 是否使用随机样本
    //     info: true,   // calculate statistic or not
    //     gravity: [0,-9.8,0] //重力加速度的大小，x，y，z三个方向可设置
    //    });
       this.world = new OIMO.World(1 / 60, 2, 8);
       this.populate();
    },

    populate:function(){
        //向物理世界添加物理物体
        // reset old
        this.world.clear(); 
        //add ground
        // var ground = this.world.add({ 
        //     type:'sphere', //  物理物体的类型，球体、长方体、圆柱体
        //     size:[1000, 10, 1000], //物理物体的大小长、高、宽
        //     pos:[0,0,0], // 物理物体的位置
        //     rot:[0,0,90], // 物理物体的旋转角度
        //     move:true, //物理物体是否是静态的
        //     density: 1,//物理物体的密度，可以用来增加物体的质量
        //     friction: 0.2,//物理物体的摩擦系数
        //     restitution: 0.2,//物理物体的弹性系数
        //     belongsTo: 1, // 物理物体所属的组别
        //     collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        // });
        var gsize=[800, 10, 800];
        this.ground = this.world.add({size:gsize,world:this.world,rot:[0,0,0]});
        this.addStaticBox(gsize,[0,0,0],[0,0,0]);
        //添加静态物体
        this.bodies=[];
        this.meshes=[];
        var boxSize = 10;
        var geometry = new THREE.BufferGeometry().fromGeometry( new THREE.SphereGeometry(1,16,10));
        var material = new THREE["MeshBasicMaterial"]( {shininess: 10, map: basicTexture(0), name:'sph' } );
        var body = this.world.add({
            type: "sphere",
            size: [boxSize],
            pos: [0, 100, 0],
            move: true,
            world: this.world
          });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(boxSize, boxSize, boxSize);
        mesh.position.set(0, 10, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.bodies.push(body);
        this.meshes.push(mesh);
        this.scene.add(mesh);
    },
    addBall:function(w){
        var mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),
        new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true }));
        mesh.scale.set(w,w,w);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
    },
    addStaticBox:function(gsize, position, rotation){
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshLambertMaterial({
            color: 0x779966,
            emissive: 0x333333,
        }));
        mesh.scale.set(gsize[0],gsize[1],gsize[2]);
        mesh.position.set(position[0],position[1],position[2]);
        mesh.rotation.set(rotation[0],rotation[1],rotation[2]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add( mesh );
        return mesh;
    },
    updateOimoPhysics:function(){
        if(this.world==null) return;
        this.world.step();
        for (var i = 0; i < this.bodies.length; i++) {
            var b = this.bodies[i];
            var m = this.meshes[i];
        
            if (!b.sleeping) {
              m.position.copy(b.getPosition());
              m.quaternion.copy(b.getQuaternion());
            }
          }
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
        var shape = new THREE.CubeGeometry(1000, 10, 1000);
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
        var width=1000;
        var split=10;
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
