import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  increment,
  setDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { referralCode } = await req.json();
    if (!referralCode) {
      return NextResponse.json({ success: false, message: "Referral code required" }, { status: 400 });
    }

    // --- FETCH CURRENT USER ---
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    // --- DUPLICATE CHECK ---
    if (userData.referredBy) {
      return NextResponse.json({ success: false, message: "Referral already used" }, { status: 400 });
    }

    // --- FIND REFERRER ---
    const referrerQuery = query(collection(db, "users"), where("referralCode", "==", referralCode));
    const referrerSnap = await getDocs(referrerQuery);
    if (referrerSnap.empty) {
      return NextResponse.json({ success: false, message: "Invalid referral code" }, { status: 400 });
    }

    const referrerDoc = referrerSnap.docs[0];
    const referrerRef = referrerDoc.ref;

    // --- PREVENT SELF REFERRAL ---
    if (referrerDoc.id === userId) {
      return NextResponse.json({ success: false, message: "You cannot use your own referral code" }, { status: 400 });
    }

    // --- REWARDS ---
    const USER_POINTS = 3;
    const REFERRER_POINTS = 5;
    const REFERRER_EARNINGS = 100;

    // --- UPDATE USER ---
    await setDoc(
      userRef,
      {
        referredBy: referralCode,
        points: increment(USER_POINTS),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // --- UPDATE REFERRER ---
    await setDoc(
      referrerRef,
      {
        referrals: increment(1),
        points: increment(REFERRER_POINTS),
        earnings: increment(REFERRER_EARNINGS),
        referredUsers: arrayUnion(userId),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // --- OPTIONAL NOTIFICATION ---
    await addDoc(collection(db, "notifications"), {
      title: "Referral Bonus 🎉",
      message: `${userData.fullName || "A user"} joined using your referral code!`,
      imageUrl: userData.imageUrl || null,
      userId: referrerDoc.id,
      type: "referral",
      createdAt: serverTimestamp(),
      read: false,
    });

    return NextResponse.json({
      success: true,
      message: "Referral applied successfully.",
      rewards: {
        userPoints: USER_POINTS,
        referrerPoints: REFERRER_POINTS,
        referrerEarnings: REFERRER_EARNINGS,
      },
    });
  } catch (err) {
    console.error("Referral error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
