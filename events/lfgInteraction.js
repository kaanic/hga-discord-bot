const { Events, EmbedBuilder } = require('discord.js');
const { addMemberToLFGPost, removeMemberFromLFGPost, getPostMembers, getLFGPost } = require('../database/repositories/lfgRepository');
const { getGame } = require('../config/gamesConfig');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// checking if button
		if (!interaction.isButton()) return;

		const customId = interaction.customId;

		// handling LFG join
		if (customId.startsWith('lfg_join_')) {
			await handleJoin(interaction);
		}
		// handling LFG leave
		else if (customId.startsWith('lfg_leave_')) {
			await handleLeave(interaction);
		}
		// handling view members button
		else if (customId.startsWith('lfg_members_')) {
			await handleViewMembers(interaction);
		}
	},
};

async function handleJoin(interaction) {
	try {
		const postId = parseInt(interaction.customId.split('_')[2]);

		// getting post details
		const post = getLFGPost(postId);
		if (!post) {
			return interaction.reply({
				content: 'This LFG post no longer exists.',
				ephemeral: true,
			});
		}

		// checking if post is full
		if (post.currentPlayers >= post.playerCountNeeded) {
			return interaction.reply({
				content: 'This LFG post is full.',
				ephemeral: true,
			});
		}

		// trying to add member
		const result = addMemberToLFGPost(postId, interaction.guildId, interaction.user.id, interaction.user.username);

		if (!result.success) {
			return interaction.reply({
				content: result.message,
				ephemeral: true,
			});
		}

		// updating post info
		const updatedPost = getLFGPost(postId);
		const spotsRemaining = updatedPost.playerCountNeeded - updatedPost.currentPlayers;

		const embed = new EmbedBuilder()
			.setColor('#6BCB77')
			.setTitle('✅ Successfully Joined LFG')
			.addFields(
				{ name: 'Game', value: getGame(updatedPost.game)?.name || updatedPost.game, inline: true },
				{ name: 'Game Type', value: updatedPost.gameType || 'Any', inline: true },
				{ name: 'Players', value: `${updatedPost.currentPlayers}/${updatedPost.playerCountNeeded}`, inline: true },
				{ name: 'Spots Remaining', value: spotsRemaining > 0 ? `${spotsRemaining}` : 'POST FULL', inline: true },
			);

		await interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	} catch (error) {
		console.error('Error joining LFG post:', error);
		await interaction.reply({
			content: 'An error occurred while joining the LFG post.',
			ephemeral: true,
		});
	}
}

async function handleLeave(interaction) {
	try {
		const postId = parseInt(interaction.customId.split('_')[2]);

		// getting post details
		const post = getLFGPost(postId);
		if (!post) {
			return interaction.reply({
				content: 'This LFG post no longer exists.',
				ephemeral: true,
			});
		}

		// trying to remove member
		const result = removeMemberFromLFGPost(postId, interaction.user.id);

		if (!result.success) {
			return interaction.reply({
				content: result.message,
				ephemeral: true,
			});
		}

		const embed = new EmbedBuilder()
			.setColor('#FF6B6B')
			.setTitle('✅ Successfully Left LFG')
			.setDescription(`You have left the ${getGame(post.game)?.name || post.game} LFG post.`);

		await interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	} catch (error) {
		console.error('Error leaving LFG post:', error);
		await interaction.reply({
			content: 'An error occurred while leaving the LFG post.',
			ephemeral: true,
		});
	}
}

async function handleViewMembers(interaction) {
	try {
		const postId = parseInt(interaction.customId.split('_')[2]);

		// getting post details
		const post = getLFGPost(postId);
		if (!post) {
			return interaction.reply({
				content: 'This LFG post no longer exists.',
				ephemeral: true,
			});
		}

		// getting all members
		const members = getPostMembers(postId);

		if (members.length === 0) {
			return interaction.reply({
				content: 'No members have joined this LFG post yet.',
				ephemeral: true,
			});
		}

		// Build member list
		const memberList = members
			.map((member, index) => `${index + 1}. <@${member.userId}> - ${member.username}`)
			.join('\n');

		const embed = new EmbedBuilder()
			.setColor('#4D96FF')
			.setTitle(`LFG Members (${members.length}/${post.playerCountNeeded})`)
			.setDescription(memberList)
			.addFields(
				{ name: 'Game', value: getGame(post.game)?.name || post.game, inline: true },
				{ name: 'Game Type', value: post.gameType || 'Any', inline: true },
			);

		await interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	} catch (error) {
		console.error('Error viewing LFG members:', error);
		await interaction.reply({
			content: 'An error occurred while fetching LFG members.',
			ephemeral: true,
		});
	}
}