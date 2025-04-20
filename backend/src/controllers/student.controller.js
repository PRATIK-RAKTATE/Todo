import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Skill } from "../models/skill.model.js"
import { Abstract } from "../models/abstract.model.js";
import { Student } from "../models/student.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DonatedAbstract } from "../models/donatedAbstract.model.js";
import { InviteAndRequest } from "../models/inviteAndRequest.model.js";
import { Group } from "../models/group.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const check = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: `your user id is ${req.user.userID}`
    })
})

const reset = asyncHandler(async (req, res) => {

    await Student.updateOne({ _id: req.user._id }, {
        $set: {
            // skills: [],
            submittedAbstracts: [],
            // certificates: [],
            // github: "",
            // groupId: "",
            // acceptedByStaffAbstracts: [],
            // finalizedAbstract: "",
            // donatedAbstracts: [],
            // invites: { sent: [], received: [] },
            // requests: { sent: [], received: [] },
        }
    })
        .catch((error) => {
            throw new ApiError(500, `Something went wrong while reseting the student - ${error.message}`);
        });

    res.status(200).json({
        success: true,
        message: "reset successfull"
    })
})


const submitSkills = asyncHandler(async (req, res) => {
    const skillsData = req.body;

    try {
        const skillsToInsert = [];
        const existingDomains = new Set();

        for (let singleData of skillsData) {
            const { domain, skills, experience } = singleData;

            // Check if domain or skills are missing or empty
            if (!domain.trim() || !Array.isArray(skills) || skills.length === 0) {
                throw new ApiError(400, "All fields are required and at least one skill must be selected");
            }

            // Avoid duplicate domains
            if (existingDomains.has(domain)) {
                continue;
            }
            existingDomains.add(domain);

            // Add valid skill data to the insert array
            skillsToInsert.push({
                ownerId: req.user._id,
                domain,
                skills,
                experience: experience || 0,
            });
        }

        // Insert skills in bulk if there are valid entries
        if (skillsToInsert.length === 0) {
            throw new ApiError(400, "No valid skill sets to insert");
        }

        const insertedSkills = await Skill.insertMany(skillsToInsert, { ordered: true });

        const skillIds = insertedSkills.map(skill => skill._id);
        await Student.findByIdAndUpdate(req.user._id, {
            $addToSet: { skills: { $each: skillIds } }
        });

        return res.status(201).json(
            new ApiResponse(200, {}, "Skills registered successfully")
        );
    } catch (error) {
        throw new ApiError(500, `Something went wrong while submitting the skill - ${error.message}`);
    }
});



const submitAbstracts = asyncHandler(async (req, res) => {
    const AbstractData = req.body;

    // Validation: Ensure the request body is an array and not empty
    if (!Array.isArray(AbstractData) || AbstractData.length === 0) {
        throw new ApiError(400, "No abstracts submitted to insert");
    }

    try {
        const abstractToInsert = [];

        // Helper function for field validation
        const validateField = (field, fieldName) => {
            if (!field?.trim()) {
                throw new ApiError(400, `${fieldName} is required and cannot be empty`);
            }
        };

        for (let singleData of AbstractData) {
            const { title, abstract, domain, keywords, matched, embedding } = singleData;

            // Validate required fields
            validateField(title, "Title");
            validateField(abstract, "Abstract");
            validateField(embedding, "Embedding");

            // Validate domain and keywords arrays
            if (Array.isArray(domain) && domain.length === 0) {
                throw new ApiError(400, "Domain cannot be empty");
            }
            if (Array.isArray(keywords) && keywords.length === 0) {
                throw new ApiError(400, "Keywords cannot be empty");
            }

            abstractToInsert.push({
                ownerId: req.mainId,
                title,
                abstract,
                domain,
                keywords,
                matched: matched,
                abstract_e: embedding,
                status: "pending"
            });
        }

        // Insert abstracts into database
        const insertedAbstract = await Abstract.insertMany(abstractToInsert, { ordered: true });

        if (insertedAbstract.length === 0) {
            throw new ApiError(400, "Proper abstracts format required");
        }

        // Get inserted abstract IDs
        const ids = insertedAbstract.map(item => item._id.toString());

        // Update student with submitted abstracts
        await Student.updateOne(
            { _id: req.user._id },
            { $push: { submittedAbstracts: { $each: ids } } }
        );

        // Respond with success message
        return res.status(201).json(
            new ApiResponse(200, {}, "Abstract submitted successfully as a whole")
        );
    } catch (error) {
        // General error handler
        throw new ApiError(500, `Something went wrong while submitting the abstract - ${error.message}`);
    }
});

const getSubmittedAbstract = asyncHandler(async (req, res) => {
    const abstracts = await Abstract.find({ ownerId: req.mainId });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    abstracts
                },
                "Abstracts loaded Successfully"
            )
        )
})

export const getApprovedAbstract = asyncHandler(async (req, res) => {
    try {
        const abstracts = await Abstract.find({ ownerId: req.mainId, status: "accepted" });
        // const hasFinalized = await Student.findOne({ _id: req.user._id, finalizedAbstract: { $exists: true } });
        // const finalizedAbstract = await Student.findById(req.user._id).select("finalizedAbstract");
        const user = req.user;

        let hasFinalized = false
        if (user.finalizedAbstract) {
            hasFinalized = true;
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        abstracts, hasFinalized
                    },
                    "Abstracts loaded Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(500, `cannot find user - ${error.message}`);
    }
})


const finalizeAbstract = asyncHandler(async (req, res) => {
    const { requirements, abstractId, donatedIds } = req.body;
    const user = req.user;

    try {
        // Input validation
        if (!abstractId || !Array.isArray(requirements) || requirements.length === 0) {
            throw new ApiError(400, "Invalid data. Provide abstractId and requirements array.");
        }

        // console.log("skillsData", requirements);
        // console.log("abstractId", abstractId);
        // console.log("donatedIds", donatedIds);

        // Update abstract requirements
        const updatedAbstract = await Abstract.findByIdAndUpdate(
            abstractId,
            { requirements },
            { new: true }
        );
        if (!updatedAbstract) {
            throw new ApiError(404, "Abstract not found or requirements not updated.");
        }

        // Handle donated abstracts
        if (donatedIds && donatedIds.length > 0) {
            const donatedAbstracts = donatedIds.map(id => ({
                abstract: id,
                InUse: false,
                acceptedBy: null,
                donatedBy: req.mainId,
            }));

            const donatedSuccess = await DonatedAbstract.insertMany(donatedAbstracts, { ordered: true });
            if (!donatedSuccess || donatedSuccess.length === 0) {
                throw new ApiError(400, "Could not insert into donated abstracts.");
            }

            user.donatedAbstracts = donatedIds;
        }

        // Update user with finalized abstract and donated abstracts
        user.finalizedAbstract = abstractId;
        const updateUserSuccess = await user.save();
        if (!updateUserSuccess) {
            throw new ApiError(400, "Could not finalize abstract or update user.");
        }

        return res.status(200).json(new ApiResponse(200, {}, "Abstract finalized successfully"));
    } catch (error) {
        console.error(error);  // Log the error for debugging
        throw new ApiError(500, `Error while submitting abstract: ${error.message}`);
    }
});

// get project requirements and matching students
const getProjectAndStudentData = asyncHandler(async (req, res) => {
    try {
        if (!req.user || !req.user.finalizedAbstract) {
            throw new ApiError(400, "User or finalized abstract ID missing");
        }

        const project = await Abstract.findById(req.user.finalizedAbstract);
        if (!project) {
            throw new ApiError(404, "Project not found");
        }

        const projectRequirements = project.requirements || [];
        const requiredDomains = projectRequirements.map(req => req.domain);
        // console.log(projectRequirements);
        // const requiredDomains = projectRequirements.map(req => ({
        //     domain: req.domain,
        //     skills: req.skills
        // }));

        const students = await Student.find().populate("skills id").select("id skills");
        if (!students.length) {
            throw new ApiError(404, "No students found");
        }

        const matchingStudents = students.filter(student =>
            student._id.toString() !== req.user._id.toString() &&
            student.skills.some(skill => requiredDomains.includes(skill.domain))
        ).map(student => ({
            id: student._id,
            name: student.id?.name || "Unknown",
            domain: student.skills.map(skill => skill.domain),
            // .filter(skill => requiredDomains.includes(skill.domain))
            skills: student.skills.flatMap(skill => skill.skills)
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        matchingStudents, projectRequirements
                    },
                    "Project and student data loaded Successfully"
                )
            );
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message || "Internal Server Error"));
    }
});

const sendInvitations = asyncHandler(async (req, res) => {
    try {
        if (!req.user || !req.user.finalizedAbstract) {
            throw new ApiError(400, "User or finalized abstract ID missing");
        }

        const { studentIds } = req.body;
        const fromStudent = req.user;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: "Invalid student IDs provided" });
        }

        // Filter out self-invitations
        const validStudentIds = studentIds.filter(toStudentId => toStudentId !== fromStudent._id.toString());
        if (validStudentIds.length === 0) {
            return res.status(400).json({ message: "Cannot send invitations to yourself" });
        }

        // Check for existing invitations
        const existingInvites = await InviteAndRequest.find({
            from: fromStudent._id,
            to: { $in: validStudentIds },
            type: "invite"
        }).select("to");

        const existingToIds = new Set(existingInvites.map(invite => invite.to.toString()));

        // check if group exists
        let groupId;
        if(fromStudent.groupId){
            groupId = fromStudent.groupId;
        }else{
            try {
                const group = await Group.create({
                    project: fromStudent.finalizedAbstract,
                    leader: fromStudent._id,
                    members: [fromStudent._id],
                });
                groupId = group._id;
            } catch (error) {
                console.error("Error creating group:", error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
            
        }

        // Create new invite requests excluding existing ones
        const newInvites = validStudentIds
            .filter(toStudentId => !existingToIds.has(toStudentId))
            .map(toStudentId => ({
                from: fromStudent._id,
                to: toStudentId,
                abstractId: fromStudent.finalizedAbstract,
                type: "invite",
                status: "pending"
            }));

        if (newInvites.length > 0) {
            await InviteAndRequest.insertMany(newInvites);
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    {},
                    newInvites.length > 0 ? "Invitations sent successfully" : "No new invitations sent"
                )
            );
    } catch (error) {
        console.error("Error sending invitations:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// const getInvitesAndRequests = asyncHandler(async (req, res) => {
//     const userId = req.user._id;

//     const sent = await InviteAndRequest.find({ from: userId })
//         .populate({ 
//             path: "to", 
//             select: "id", 
//             populate: { 
//                 path: "id", 
//                 select: "name" 
//             } 
//         })
//         .populate({ 
//             path: "abstractId", 
//             select: "title abstract domain requirements" 
//         })

//     const received = await InviteAndRequest.find({ to: userId })
//         .populate({
//             path: 'from',
//             select: 'id skills',
//             populate: [
//                 { path: 'id', select: 'name' },
//                 { path: 'skills' }
//             ]
//         })
//         .populate({
//             path: 'abstractId',
//             select: 'title abstract domain requirements'
//         });

//     const sentInvites = sent.filter((invite) => invite.type === "invite").map((invite) => ({
//         name: invite.to.id.name,
//         date: invite.createdAt,
//         status: invite.status,
//     }));

//     const sentRequests = sent.filter((invite) => invite.type === "request").map((invite) => ({
//         name: invite.to.id.name,
//         date: invite.createdAt,
//         abstract: {
//             title: invite.abstractId.title,
//             abstract: invite.abstractId.abstract,
//             domain: invite.abstractId.domain,
//             requirements: invite.abstractId.requirements,
//         },
//         status: invite.status,
//     }));

//     const receivedInvites = received.filter((invite) => invite.type === "invite").map((invite) => ({
//         name: invite.from.id.name,
//         date: invite.createdAt,
//         abstract: {
//             title: invite.abstractId.title,
//             abstract: invite.abstractId.abstract,
//             domain: invite.abstractId.domain,
//             requirements: invite.abstractId.requirements,
//         },
//         status: invite.status,
//     }));

//     const receivedRequests = received.filter((invite) => invite.type === "request").map((invite) => ({
//         name: invite.from.id.name,
//         date: invite.createdAt,
//         skills: invite.from.skills,
//         status: invite.status,
//     }))


//     return res.status(200).json(
//         new ApiResponse(200, {
//             sentInvites,
//             sentRequests,
//             receivedInvites,
//             receivedRequests
//         }, "Data fetched successfully")
//     );
// });

const getInvitesAndRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch all invites and requests related to the user
    const invitesAndRequests = await InviteAndRequest.find({
        $or: [{ from: userId }, { to: userId }]
    })
    .populate({
        path: 'from to',
        select: 'id skills',
        populate: { path: 'id', select: 'name' }
    })
    .populate({
        path: 'abstractId',
        select: 'title abstract domain requirements'
    });

    // Process fetched data
    const response = {
        sentInvites: [],
        sentRequests: [],
        receivedInvites: [],
        receivedRequests: []
    };

    invitesAndRequests.forEach(invite => {
        const isSent = invite.from._id.equals(userId);
        const counterparty = isSent ? invite.to : invite.from;

        const inviteData = {
            name: counterparty.id.name,
            date: invite.createdAt.toLocaleDateString('en-GB'), // Format as DD/MM/YYYY
            status: invite.status,
            inviteId: invite._id
        };

        if (invite.type === "invite") {
            isSent ? response.sentInvites.push(inviteData) : response.receivedInvites.push({
                ...inviteData,
                abstract: invite.abstractId && {
                    title: invite.abstractId.title,
                    abstract: invite.abstractId.abstract,
                    domain: invite.abstractId.domain,
                    requirements: invite.abstractId.requirements,
                }
            });
        } else {
            isSent ? response.sentRequests.push({
                ...inviteData,
                abstract: invite.abstractId && {
                    title: invite.abstractId.title,
                    abstract: invite.abstractId.abstract,
                    domain: invite.abstractId.domain,
                    requirements: invite.abstractId.requirements
                }
            }) : response.receivedRequests.push({
                ...inviteData,
                skills: invite.from.skills
            });
        }
    });

    return res.status(200).json(new ApiResponse(200, response, "Data fetched successfully"));
});


// response to invites - accept and reject
const inviteResponse = asyncHandler(async (req, res) => {
    const { inviteId, response } = req.body;

    if (!inviteId || !response) {
        throw new ApiError(400, "Invite ID and response are required");
    }

    const invite = await InviteAndRequest.findById(inviteId);

    if (!invite) {
        throw new ApiError(404, "Invite not found");
    }

    if (invite.status !== "pending") {
        throw new ApiError(400, "Invite is not pending");
    }

    // check if group has less than 4 members
    let group = await Group.findById(invite.groupId);
    let memberCount = 0;
    if (group) {
        if (group.members.length >= 4) {
            throw new ApiError(400, "Group has already 4 members");
        }
    
        // check number of members in group
        memberCount = group.members.length;

    
        // check if group is completed
        if (group.status === "completed") {
            throw new ApiError(400, "Group is not accepting more members");
        }
    }


    invite.status = response;
    await invite.save();

    // update group members
    if (response === "accepted" && group) {
        group.members.push(invite.to);
        if (memberCount === 3) {
            group.status = "completed";
        }
        await group.save();
    }

    // change group status if group is full
    

    if (response === "accepted") {
        return res.status(200).json(new ApiResponse(200, {}, "Invite accepted successfully"));
    } else {
        return res.status(200).json(new ApiResponse(200, {}, "Invite rejected successfully"));
    }
})

const studentDashboard = asyncHandler(async (req, res) => {


    const data = {
        skillSubmitted: req.user.skills.length > 0,
    }



    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    data
                },
                "User dashboard loaded Successfully"
            )
        )
});



export {
    check,
    reset,
    submitSkills,
    submitAbstracts,
    studentDashboard,
    getSubmittedAbstract,
    finalizeAbstract,
    getProjectAndStudentData,
    sendInvitations,
    getInvitesAndRequests,
    inviteResponse
}