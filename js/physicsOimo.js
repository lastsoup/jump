// three var
var camera, scene, light, renderer, canvas, controls;
var meshs = [];
var grounds = [];

var isMobile = false;
var antialias = true;

var geos = {};
var mats = {};

//oimo var
var cannonDebugRenderer=null;
var world = null;
var bodys = [];

var fps = [0,0,0,0];
var ToRad = 0.0174532925199432957;
var type = 1;
var infos;

main={
    flag:"0",
    init:function(){
        //添加3D世界
        this.initTree3D();
        //添加事件
        window.addEventListener( 'resize', this.onWindowResize, false );
        //添加做表系统
        this.buildAuxSystem();
        //添加物理世界
       this.initOimoPhysics();
        this.loop();
    },
    initTree3D:function(){
        var n = navigator.userAgent;
        if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i)){ isMobile = true;  antialias = false; document.getElementById("MaxNumber").value = 200; }

        infos = document.getElementById("info");

        canvas = document.getElementById("canvas");

        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 5000 );
        camera.position.set( 0, 160, 400 );

        controls = new THREE.OrbitControls( camera, canvas );
        controls.target.set(0, 20, 0);
        controls.update();

        scene = new THREE.Scene();

        renderer = new THREE.WebGLRenderer({ canvas:canvas, precision: "mediump", antialias:antialias });
        renderer.setSize( window.innerWidth, window.innerHeight );

        var materialType = 'MeshBasicMaterial';
        
        if(!isMobile){

            scene.add( new THREE.AmbientLight( 0x3D4143 ) );
            light = new THREE.DirectionalLight( 0xffffff , 1.4);
            light.position.set( 300, 1000, 500 );
            light.target.position.set( 0, 0, 0 );
            light.castShadow = true;

            var d = 300;
            light.shadow.camera = new THREE.OrthographicCamera( -d, d, d, -d,  500, 1600 );
            light.shadow.bias = 0.0001;
            light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;

            scene.add( light );

            materialType = 'MeshPhongMaterial';

            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;//THREE.BasicShadowMap;
        }

        // background
        var buffgeoBack = new THREE.BufferGeometry();
        buffgeoBack.fromGeometry( new THREE.IcosahedronGeometry(3000,2) );
        var back = new THREE.Mesh( buffgeoBack, new THREE.MeshBasicMaterial( { map:this.TEXTURES.gradTexture([[0.75,0.6,0.4,0.25], ['#1B1D1E','#3D4143','#72797D', '#b0babf']]), side:THREE.BackSide, depthWrite: false, fog:false }  ));
        //back.geometry.applyMatrix(new THREE.Matrix4().makeRotationZ(15*ToRad));
        scene.add( back );

        // geometrys
        geos['sphere'] = new THREE.BufferGeometry().fromGeometry( new THREE.SphereGeometry(1,16,10));
        geos['box'] = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(1,1,1));
        geos['cylinder'] = new THREE.BufferGeometry().fromGeometry(new THREE.CylinderGeometry(1,1,1));

        // materials
        mats['sph']    = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(0), name:'sph' } );
        mats['box']    = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(2), name:'box' } );
        mats['cyl']    = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(4), name:'cyl' } );
        mats['ssph']   = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(1), name:'ssph' } );
        mats['sbox']   = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(3), name:'sbox' } );
        mats['scyl']   = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(5), name:'scyl' } );
        mats['ground'] = new THREE[materialType]( {shininess: 10, color:0x3D4143, transparent:true, opacity:0.5 } );
    },
    loop:function(){
        main.updateOimoPhysics();
        renderer.render( scene, camera );
        requestAnimationFrame( main.loop );
    },
    onWindowResize:function(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    },
    buildAuxSystem:function(){
        var axisHelper = new THREE.AxesHelper(3000)
        scene.add(axisHelper);
        var width=400;
        var split=10;
        var gridHelperx = new THREE.GridHelper(width,split)//长宽600等分60格1格等于10
        var gridHelpery = new THREE.GridHelper(width,split)
        var gridHelperz = new THREE.GridHelper(width,split)
        gridHelperx.rotateX(-Math.PI / 2);
        gridHelperz.rotateZ(Math.PI / 2);
        scene.add(gridHelperx);
        scene.add(gridHelpery);
        scene.add(gridHelperz);
    },
    addStaticBox:function(size, position, rotation){
        var mesh = new THREE.Mesh( geos.box, mats.ground );
        mesh.scale.set( size[0], size[1], size[2] );
        mesh.position.set( position[0], position[1], position[2] );
        mesh.rotation.set( rotation[0]*ToRad, rotation[1]*ToRad, rotation[2]*ToRad );
        scene.add( mesh );
        grounds.push(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    },
    clearMesh:function(){
        var i=meshs.length;
        while (i--) scene.remove(meshs[ i ]);
        i = grounds.length;
        while (i--) scene.remove(grounds[ i ]);
        grounds = [];
        meshs = [];
    },
    initOimoPhysics:function(){
        //     this.world = new OIMO.World({ 
        //     timestep: 1/60, //物理世界的刷新频率，通常为60帧每秒
        //     iterations: 8, 
        //     broadphase: 2, // 碰撞检测算法类型，2号算法比较稳定
        //     worldscale: 1, // 物理世界的缩放 
        //     random: true,  // 是否使用随机样本
        //     info: true,   // calculate statistic or not
        //     gravity: [0,-9.8,0] //重力加速度的大小，x，y，z三个方向可设置
        //    });
        world = new OIMO.World({info:true, worldscale:100} );
        this.populate(1);
    },
    populate:function(n){
        var max = document.getElementById("MaxNumber").value;

        if(n===1) type = 1
        else if(n===2) type = 2;
        else if(n===3) type = 3;
        else if(n===4) type = 4;

        // reset old
        this.clearMesh();
        world.clear();
        bodys=[];

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
        var gsize=[400, 10, 400],gpos=[0,0,0];
        world.add({size:gsize, pos:gpos, world:world});
        this.addStaticBox(gsize, gpos, [0,0,0]);

        //add object
        var x, y, z, w, h, d;
        var i = max;

        while (i--){
            if(type===4) t = Math.floor(Math.random()*3)+1;
            else t = type;
            x = -100 + Math.random()*200;
            z = -100 + Math.random()*200;
            y = 100 + Math.random()*1000;
            w = 10 + Math.random()*10;
            h = 10 + Math.random()*10;
            d = 10 + Math.random()*10;

            if(t===1){
                bodys[i] = world.add({type:'sphere', size:[w*0.5], pos:[x,y,z], move:true, world:world});
                meshs[i] = new THREE.Mesh( geos.sphere, mats.sph );
                meshs[i].scale.set( w*0.5, w*0.5, w*0.5);
            } else if(t===2){
                bodys[i] = world.add({type:'box', size:[w,h,d], pos:[x,y,z], move:true, world:world});
                meshs[i] = new THREE.Mesh( geos.box, mats.box);
                meshs[i].scale.set( w, h, d );
            } else if(t===3){
                bodys[i] = world.add({type:'cylinder', size:[w*0.5,h], pos:[x,y,z], move:true, world:world});
                meshs[i] = new THREE.Mesh( geos.cylinder, mats.cyl);
                meshs[i].scale.set( w*0.5, h, w*0.5 );
            }

            meshs[i].castShadow = true;
            meshs[i].receiveShadow = true;

            scene.add( meshs[i] );
        }

    },
    updateOimoPhysics:function(){
        if(world==null) return;

        world.step();

        var x, y, z, mesh, body, i = bodys.length;

        while (i--){
            body = bodys[i];
            mesh = meshs[i];

            if(!body.sleeping){

                mesh.position.copy(body.getPosition());
                mesh.quaternion.copy(body.getQuaternion());

                // change material
                if(mesh.material.name === 'sbox') mesh.material = mats.box;
                if(mesh.material.name === 'ssph') mesh.material = mats.sph;
                if(mesh.material.name === 'scyl') mesh.material = mats.cyl; 

                // reset position
                if(mesh.position.y<-100){
                    x = -100 + Math.random()*200;
                    z = -100 + Math.random()*200;
                    y = 100 + Math.random()*1000;
                    body.resetPosition(x,y,z);
                }
            } else {
                if(mesh.material.name === 'box') mesh.material = mats.sbox;
                if(mesh.material.name === 'sph') mesh.material = mats.ssph;
                if(mesh.material.name === 'cyl') mesh.material = mats.scyl;
            }
        }

        infos.innerHTML = world.getInfo();
    },
    TEXTURES:{
        gradTexture:function(color){
            var c = document.createElement("canvas");
            var ct = c.getContext("2d");
            var size = 1024;
            c.width = 16; c.height = size;
            var gradient = ct.createLinearGradient(0,0,0,size);
            var i = color[0].length;
            while(i--){ gradient.addColorStop(color[0][i],color[1][i]); }
            ct.fillStyle = gradient;
            ct.fillRect(0,0,16,size);
            var texture = new THREE.Texture(c);
            texture.needsUpdate = true;
            return texture;
        },
        basicTexture:function(n){
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
    }
}