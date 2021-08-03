//#####################################################################
// Main
// Dartmouth COSC 77/177 Computer Graphics, starter code
// Contact: Bo Zhu (bo.zhu@dartmouth.edu)
//#####################################################################
#include <iostream>
#include <random>
#include <vector>
#include <algorithm>
#include <unordered_set>
#include "Common.h"
#include "Driver.h"
#include "OpenGLMesh.h"
#include "OpenGLCommon.h"
#include "OpenGLWindow.h"
#include "OpenGLViewer.h"
#include "OpenGLMarkerObjects.h"
#include "TinyObjLoader.h"

#ifndef __Main_cpp__
#define __Main_cpp__

#ifdef __APPLE__
#define CLOCKS_PER_SEC 100000
#endif

class FinalProjectDriver : public Driver, public OpenGLViewer
{
	using Base = Driver;
	std::vector<OpenGLTriangleMesh*> mesh_object_array;						////mesh objects, every object you put in this array will be rendered.
	clock_t startTime;

public:
	virtual void Initialize()
	{
		draw_bk = false;						////turn off the default background and use the customized one
		draw_axes = false;						////if you don't like the axes, turn them off!
		startTime = clock();
		OpenGLViewer::Initialize();
	}

	void Add_Shaders()
	{
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("background.vert", "background.frag", "background");
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("basic_shadow.vert","basic_shadow.frag","basic_shadow");	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("cup_shadow.vert","cup_shadow.frag","cup_shadow");	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("plate_shadow.vert","plate_shadow.frag","plate_shadow");	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("table_shadow.vert","table_shadow.frag","table_shadow");	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("post.vert","post.frag","post_processing");	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("image.vert", "image.frag", "image");
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("toast.vert", "toast.frag", "toast");
	}

	void Add_Textures()
	{
		////format: image name, texture name
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("table_color.png", "table_albedo");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("table_normal.png", "table_normal");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("post_image.png", "post_albedo");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("toast_image.png", "toast_image");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("toast.png", "toast_albedo");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("toast_normal.png", "toast_normal");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("kitchen.png", "background_albedo");
	}

	void Add_Background()
	{
		OpenGLBackground* opengl_background = Add_Interactive_Object<OpenGLBackground>();
		opengl_background->shader_name = "background";
		opengl_background->Initialize();
	}

	void Update_Vertex_UV_For_Mesh_Object(OpenGLTriangleMesh* obj)
	{
		int vn = (int)obj->mesh.Vertices().size();					////number of vertices of a mesh
		std::vector<Vector3>& vertices = obj->mesh.Vertices();		////you might find this array useful
		std::vector<Vector2>& uv = obj->mesh.Uvs();					////you need to set values in uv to specify the texture coordinates
		uv.resize(vn);
		for (int i = 0; i < vn; i++) { uv[i] = Vector2(0., 0.); }				////set uv to be zero by default

		Update_Uv_Using_Spherical_Coordinates(vertices, uv);
	}

	void Update_Uv_Using_Spherical_Coordinates(const std::vector<Vector3>& vertices, std::vector<Vector2>& uv)
	{
		const double pi = 3.14159265358979323846;
		for (int i = 0; i < vertices.size(); i++) {
			double x = vertices[i][0], y = vertices[i][1], z = vertices[i][2];
			double phi = atan2(y, x);
			double theta = atan2(sqrt(x * x + y * y), z);
			uv[i][0] = phi / 2 / pi;
			uv[i][1] = theta / pi;
		}
	}

	int Add_Table()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "table.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		////column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 0.f, 0.f, 1.f);		////column 3	////set the translation in the last column

  ////set up shader
    	mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("table_shadow"));

		////set up texture
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("table_albedo"));
		mesh_obj->Add_Texture("tex_normal", OpenGLTextureLibrary::Get_Texture("table_normal"));
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Shadow);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Image()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "image_plane.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		////column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 0.f, 0.f, 1.f);		////column 3	////set the translation in the last column

		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("post_processing"));

		////set up texture
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("post_albedo"));
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Texture);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Toast()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "toast.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		////column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 0.f, 0.f, 1.f);		////column 3	////set the translation in the last column

  		////set up shader
    	mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("basic_shadow"));

		////set up texture
		mesh_obj->Add_Texture("tex_image", OpenGLTextureLibrary::Get_Texture("toast_image"));
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("toast_albedo"));
		mesh_obj->Add_Texture("tex_normal", OpenGLTextureLibrary::Get_Texture("toast_normal"));
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Shadow);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Crumbs()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "crumbs.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		////column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 0.f, 0.f, 1.f);		////column 3	////set the translation in the last column

 	 	////set up shader
    	mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("toast"));

		////set up texture
		mesh_obj->Add_Texture("tex_image", OpenGLTextureLibrary::Get_Texture("toast_image"));
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("toast_albedo"));
		mesh_obj->Add_Texture("tex_normal", OpenGLTextureLibrary::Get_Texture("toast_normal"));
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Texture);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Toast2()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "toast2.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		////column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 0.f, 0.f, 1.f);		////column 3	////set the translation in the last column

  		////set up shader
		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("toast"));

		////set up texture
		mesh_obj->Add_Texture("tex_image", OpenGLTextureLibrary::Get_Texture("toast_image"));
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("toast_albedo"));
		mesh_obj->Add_Texture("tex_normal", OpenGLTextureLibrary::Get_Texture("toast_normal"));
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Texture);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Plate()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "plate.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		//column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 0.f, 0.f, 1.f);		////column 3	////set the translation in the last column

  		////set up shader
    	mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("plate_shadow"));

		////set up texture
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Shadow);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Cup()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "cup.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		//column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 0.f, 0.f, 1.f);		////column 3	////set the translation in the last column

  		////set up shader
  		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("cup_shadow"));

		////set up texture
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Shadow);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Background1()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name = "back.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name, meshes);
		mesh_obj->mesh = *meshes[0];

		mesh_obj->model_matrix =
			glm::mat4(1.f, 0.f, 0.f, 0.f,		//column 0
				0.f, 1.f, 0.f, 0.f,		////column 1
				0.f, 0.f, 1.f, 0.f,		////column 2
				0.f, 1.f, 0.f, 1.f);		////column 3	////set the translation in the last column

        ////set up shader
		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("image"));

		////set up texture
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("background_albedo"));
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Texture);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	int Add_Plane()
	{
		auto mesh_obj = Add_Interactive_Object<OpenGLTriangleMesh>();
		auto& mesh = mesh_obj->mesh;

		////vertex position
		std::vector<Vector3> triangle_vertices = { Vector3(-10,0,-10),Vector3(10,0,-10),Vector3(-10,0,10),Vector3(10,0,10) };
		std::vector<Vector3>& vertices = mesh_obj->mesh.Vertices();
		vertices = triangle_vertices;

		////vertex color
		std::vector<Vector4f>& vtx_color = mesh_obj->vtx_color;
		vtx_color = { Vector4f(1.f,0.f,0.f,1.f),Vector4f(0.f,1.f,0.f,1.f),Vector4f(0.f,0.f,1.f,1.f),Vector4f(1.f,1.f,0.f,1.f) };

		////vertex normal
		std::vector<Vector3>& vtx_normal = mesh_obj->vtx_normal;
		vtx_normal = { Vector3(0.,1.,0.),Vector3(0.,1.,0.),Vector3(0.,1.,0.),Vector3(0.,1.,0.) };

		////vertex uv
		std::vector<Vector2>& uv = mesh_obj->mesh.Uvs();
		uv = { Vector2(0.,0.),Vector2(1.,0.),Vector2(0.,1.),Vector2(1.,1.) };

		////mesh elements
		std::vector<Vector3i>& elements = mesh_obj->mesh.Elements();
		elements = { Vector3i(0,1,3),Vector3i(0,3,2) };

		////set up shader
		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("basic_shadow"));

		////set up texture
		Set_Polygon_Mode(mesh_obj, PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj, ShadingMode::Shadow);

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size() - 1;
	}

	void Init_Lighting() {
		auto dir_light = OpenGLUbos::Add_Directional_Light(glm::vec3(-0.2f, -1.f, 1.f));//Light direction
		dir_light->dif = glm::vec4(.9, .8, .7, 1.0);//diffuse reflection color
		dir_light->Set_Shadow();
		OpenGLUbos::Set_Ambient(glm::vec4(.01f, .01f, .02f, 1.f));
		OpenGLUbos::Update_Lights_Ubo();
	}

	virtual void Initialize_Data()
	{
		Add_Shaders();
		Add_Textures();
		Add_Plate();
		Add_Cup();
		Add_Toast();
		Add_Crumbs();
		//Add_Image();		
		Add_Table();
		Add_Toast2();
		Add_Background1();
		Init_Lighting();
	}

	////Goto next frame 
	virtual void Toggle_Next_Frame()
	{
		for (auto& mesh_obj : mesh_object_array) {
			mesh_obj->setTime(GLfloat(clock() - startTime) / CLOCKS_PER_SEC);
		}
		OpenGLViewer::Toggle_Next_Frame();
	}

	virtual void Run()
	{
		OpenGLViewer::Run();
	}
};

int main(int argc, char* argv[])
{
	FinalProjectDriver driver;
	driver.Initialize();
	driver.Run();
}

#endif