import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("imageUrl");

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL required" },
        { status: 400 }
      );
    }

    // In a real implementation, you would use a library like sharp or canvas
    // to add a watermark to the image. For now, we'll return the original URL
    // with instructions for the client to handle watermarking.

    // For production, implement watermarking server-side:
    // 1. Fetch the image
    // 2. Add "Hotel Nahoui" watermark in corner
    // 3. Return the watermarked image

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      watermarkText: "Hotel Nahoui",
      shareUrl: `${req.nextUrl.origin}/photobook?photo=${photoId}`,
      message: "Watermarking would be implemented with sharp/canvas library",
    });
  } catch (error) {
    console.error("Error generating share link:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération du lien de partage" },
      { status: 500 }
    );
  }
}
