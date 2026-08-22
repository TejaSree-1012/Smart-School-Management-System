import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Teacher from "@/app/models/Teacher";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const teacher = await Teacher.findById(id).select("-password");
    
    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }
    
    return NextResponse.json(teacher);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching teacher" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    delete body.password;

    const teacher = await Teacher.findByIdAndUpdate(id, body, { new: true }).select("-password");
    
    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }
    
    return NextResponse.json(teacher);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error updating teacher" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    await connectDB();
    const { id } = await params;
    
    const teacher = await Teacher.findByIdAndDelete(id);
    
    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error deleting teacher" },
      { status: 500 }
    );
  }
}
