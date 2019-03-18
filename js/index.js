var INTERSECTED;
//几何体https://www.cnblogs.com/w-wanglei/p/6741587.html；https://blog.csdn.net/zhulx_sz/article/details/78798937
//相机https://www.cnblogs.com/v-weiwang/p/6072235.html
//材质https://segmentfault.com/a/1190000014639067
var host="model/rocket";
var jsonModels= [{
    src: host+"/1/1",
    emissive: host+"/1/1.jpg",
    name: "fh"
},
{
    src: host+"/2/2",
    emissive: host+"/2/2.jpg",
    alpha: host+"/2/2a.jpg",
    name: "2"
},
{
    src: host+"/3/3",
    emissive: host+"/3/3.jpg",
    name: "3"
},
{
    src: host+"/4/4",
    emissive: host+"/4/4.jpg",
    name: "4"
},
{
    src: host+"/5/5",
    emissive: host+"/5/5.jpg",
    name: "5"
},
{
    src: host+"/6/6",
    emissive: host+"/6/6.jpg",
    name: "6"
},
{
    src: host+"/7/7",
    emissive: host+"/7/7.jpg",
    name: "7"
},
{
    src: host+"/8/8",
    emissive: host+"/8/8.jpg",
    name: "8"
},
{
    src: host+"/9/9",
    emissive: host+"/9/9.jpg",
    alpha: host+"/9/9a.jpg",
    name: "9"
},
{
    src: host+"/10/10",
    emissive: host+"/10/10.jpg",
    alpha: host+"/10/10a.jpg",
    name: "10"
},
{
    src: host+"/11/111",
    emissive: host+"/11/111.jpg",
    alpha: host+"/11/111a.jpg",
    name: "111"
},
{
    src: host+"/11/112",
    emissive: host+"/11/112.jpg",
    alpha: host+"/11/112a.jpg",
    name: "112"
},
{
    src: host+"/11/113",
    emissive: host+"/11/113.jpg",
    alpha: host+"/11/113a.jpg",
    name: "113"
},
{
    src: host+"/11/114",
    emissive: host+"/11/114.jpg",
    alpha: host+"/11/114a.jpg",
    name: "114"
},
{
    src: host+"/12/12",
    emissive: host+"/12/12.jpg",
    name: "12"
},
{
    src: host+"/13/13",
    emissive: host+"/13/13.jpg",
    name: "13"
},
{
    src: host+"/g/g",
    emissive: host+"/g/gnr.jpg",
    name: "g"
},
{
    src: host+"/flame/flame",
    emissive: host+"/flame/flame.png",
    name: "flame"
}
];
var mixer;
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
        document.addEventListener('mousemove', this.onDocumentMouseMove, false);
        window.addEventListener('resize', this.onWindowResize, false);
        //this.addTreeMod();
        //this.addDamagedHelmetMod();
        //this.addFbxMod();
        this.buildLightSystem();//添加光源线
        this.buildAuxSystem();//添加坐标系统
        //this.addGround();
        //this.buildMall();
        this.addMap();//添加地图
       
        this.animation();
        //this.addLabel();
    },
    loadControls:function(){
        //创建场景Controls
        var controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
        controls.screenSpacePanning = true;
        controls.enableDamping = true
        controls.dampingFactor = 0.25
        controls.rotateSpeed = 0.35
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
        var delta = this.clock.getDelta();
        if ( mixer ) mixer.update( delta );
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
    onDocumentMouseMove:function(){
        event.preventDefault();
        main.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        main.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },
    onWindowResize: function(){
        main.camera.aspect = window.innerWidth / window.innerHeight;
        main.camera.updateProjectionMatrix();
        main.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    MultiMap:function(){
        var subdivisions = {
            'h' : 8,
            'w' : 8
        };
        var zoom = 12;
        var xTileBase = 2120;
        var yTileBase = 1498;
        var width=75;
        var planeGeometry = new THREE.PlaneGeometry(width,width);
        var group =new THREE.Group();
        for (var row = 0; row < subdivisions.h; row++) {
            for (var col = 0; col < subdivisions.w; col++) {
                var texture = new THREE.TextureLoader().load( "http://b.tile.openstreetmap.org/" + zoom + "/" + (xTileBase + col) + "/" + (yTileBase - row) + ".png");
                var planeMaterial = new THREE.MeshBasicMaterial({
                    map:texture,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    transparent: true
                });
                var mesh=new THREE.Mesh(planeGeometry, planeMaterial);
                mesh.receiveShadow=true;
                mesh.position.set(width*col,width*row,0);
                group.add(mesh);
            }
        }
        var half=-(300-width/2);
        group.rotateX(-Math.PI / 2);
        group.position.set(half,0,-half);
        return group;
    },
    addMap:function(){
        var object = this.MultiMap();
        this.scene.add(object);
    },
    // 构建平地
    addGround: function(){
        var shape = new THREE.CubeGeometry(600, 10, 600);
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
    // 构建商场建筑
    buildMall:function(){
        // 建一个空对象用来放场景物体
        this.mall = new THREE.Object3D();
        // 获取html中的svg地图路径
        var svgShapes = document.querySelector('#svg_shapes')
        var paths = svgShapes.querySelectorAll('path')
        for (var i = 0; i < paths.length; i++) {
            var d = paths[i].getAttribute('d')
            // 使用插件将svg路径转化为THREE.js形状https://www.2cto.com/kf/201712/706141.html
            var shape = transformSVGPathExposed(d)
            // 将形状挤出
            var svgGeometry = new THREE.ExtrudeGeometry(shape, {
            amount: 100,
            stes: 1,
            bevelEnabled: false
            })
            // 由于平面转3D是竖直方向的, 需要旋转为水平方向
            svgGeometry.rotateX(Math.PI / 2)
            // 获取svg平面图每个模块对应的颜色
            var color = paths[i].getAttribute('fill')
            //MeshBasicMaterial：对光照无感，给几何体一种简单的颜色或显示线框。
            //MeshLambertMaterial：这种材质对光照有反应，用于创建暗淡的不发光的物体。
            //MeshPhongMaterial：这种材质对光照也有反应，用于创建金属类明亮的物体。
            var svgMaterial = new THREE.MeshPhongMaterial({ color: color, opacity: 1,shininess:100 })
            var svgMesh = new THREE.Mesh(svgGeometry, svgMaterial)
            //svgMesh.position.set(0,75, 0);
            svgMesh.name = paths[i].getAttribute('name');
            svgMesh.castShadow=true;
            svgMesh.receiveShadow=true;
            this.mall.add(svgMesh);
            
        }
        this.mall.translateX(-200)
        this.mall.translateZ(-200)
        this.mall.translateY(100)
        this.scene.add(this.mall);
    },
    //辅助系统: 网格和坐标
    buildAuxSystem:function(){
        var axisHelper = new THREE.AxesHelper(2000)
        this.scene.add(axisHelper);
        var width=600;
        var split=8;
        var gridHelperx = new THREE.GridHelper(width,split)//长宽600等分60格1格等于10
        var gridHelpery = new THREE.GridHelper(width,split)
        var gridHelperz = new THREE.GridHelper(width,split)
        gridHelperx.rotateX(-Math.PI / 2);
        gridHelperz.rotateZ(Math.PI / 2);
        this.scene.add(gridHelperx);
        this.scene.add(gridHelpery);
        this.scene.add(gridHelperz);
    },
    //添加每个店面的标签: 暂时用小方块代替
    addLabel:function(){
        var material = new THREE.MeshPhongMaterial({ color: 0x000000 })
        // 遍历场景中的元素, 在元素上方添加方块: 未来添加具体标签
        this.mall.children.forEach(function(elem){
          var geometry = new THREE.BoxGeometry(2,20,2)
          var Mesh = new THREE.Mesh(geometry, material);
          Mesh.position.y = 100;
          Mesh.position.x = elem.geometry.boundingSphere.center.x - 200
          Mesh.position.z = elem.geometry.boundingSphere.center.z - 200
          main.scene.add(Mesh);
        })
    },
    addFbxMod:function(){
      				// model
				var loader = new THREE.FBXLoader();//'model/fbx/Samba Dancing.fbx'
				loader.load( 'model/fbx/Samba Dancing.fbx', function ( object ) {

					mixer = new THREE.AnimationMixer( object );

					var action = mixer.clipAction( object.animations[ 0 ] );
					action.play();

					object.traverse( function ( child ) {

						if ( child.isMesh ) {

							child.castShadow = true;
							child.receiveShadow = true;

						}

					} );

					main.scene.add( object );
				} );
    },
    addDamagedHelmetMod:function(){
        _this = this;
        var urls = [ 'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg' ];
        var hdrUrls = [ 'px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr' ];
        //反射的环境图
        var JPGCubeMap = new THREE.CubeTextureLoader().setPath( 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/cube/Bridge2/' ).load( urls );
        var hdrCubeMap = new THREE.HDRCubeTextureLoader().setPath( 'textures/pisaHDR/').load(THREE.UnsignedByteType,hdrUrls);
       
        var loader = new THREE.GLTFLoader();
        var path1='model/DamagedHelmet/DamagedHelmet.gltf';
        loader.load(path1, function ( gltf ) {
            gltf.scene.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.material.envMap = hdrCubeMap;
                    child.scale.set(100, 100, 100);
                    child.position.set(0,100, 0);
                    child.castShadow= true;
                    child.receiveShadow = true;
                }
            } );
            _this.scene.add( gltf.scene );
        }, undefined, function ( e ) {
            console.error( e );
        } );
    },
    addTreeMod: function(){
        _this = this;
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setCrossOrigin(true); 
        var objLoader = new THREE.OBJLoader();
        mtlLoader.load('model/tree/materials.mtl', function(material){
            objLoader.load('model/tree/model.obj',function(object){
                _this.tree = object;
                var children = object.children;
                for (var i = 0; i < children.length; i++) {
                    children[i].castShadow= true;
                    children[i].receiveShadow = true;
                }
                object.scale.set(100, 100, 100);
                object.translateY(32);
                _this.scene.add(object);
            });
            objLoader.setMaterials(material);
        });
    },
    loadJsonModel:function(loader,model){
        loader.load(model.src+".json",
        function(geometry, materials) {
            var material = new THREE.MeshPhongMaterial;
            material.emissive = new THREE.Color(16777215);
            material.color = new THREE.Color(657930);
            material.emissiveMap = (new THREE.TextureLoader).load(model.emissive);
            material.shading = THREE.FlatShading;
            material.side = THREE.DoubleSide;       
            if (model.alpha) {
                material.alphaMap = (new THREE.TextureLoader).load(model.alpha);
                material.alphaTest = .4;
                material.transparent = true;
            }
            material.anisotropy = 16;
            geometry.castShadow = !0;
            geometry.receiveShadow = !1;
            geom = new THREE.Mesh(geometry, material);
            geom.name = model.name;
            if (model.name == "g") {
                material.shininess = 0
            }
            geom.rotateY(Math.PI/18);
            geom.translateY(0.5);
            geom.translateZ(-150);
            main.scene.add(geom);
        })
    },
    launch:function(){
        var p=main.scene.getObjectByName("fh").position;
    },
    loading:function(){
        THREE.DefaultLoadingManager.onStart = function(url, itemsLoaded, itemsTotal) {
           
        };

        THREE.DefaultLoadingManager.onLoad = function() {
           main.launch();
        }

        THREE.DefaultLoadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {

        }

        THREE.DefaultLoadingManager.onError = function(url) {

        }
    },
    addRocket:function(){
        //https://zhuanlan.zhihu.com/p/35087860?edition=yidianzixun&utm_source=yidianzixun&yidian_docid=0Ig6wFNx
        this.loading();
        var loader = new THREE.JSONLoader();
        jsonModels.forEach(function(model){
          main.loadJsonModel(loader,model);
        });
    }
};

main.init();
